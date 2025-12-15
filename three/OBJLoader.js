import {
    BufferGeometry,
    FileLoader,
    Float32BufferAttribute,
    Group,
    LineBasicMaterial,
    LineSegments,
    Loader,
    Material,
    Mesh,
    MeshPhongMaterial,
    PointsMaterial,
    Vector3,
    Color,
    Object3D,
    InstancedMesh
} from './three.module.js';

// o object_name | g group_name
const _object_pattern = /^[og]\s*(.+)?/;
// mtllib file_reference
const _material_library_pattern = /^mtllib /;
// usemtl material_name
const _material_use_pattern = /^usemtl /;
// usemap map_name
const _map_use_pattern = /^usemap /;
const _face_vertex_data_separator_pattern = /\s+/;

const _vA = new Vector3();
const _vB = new Vector3();
const _vC = new Vector3();

const _ab = new Vector3();
const _cb = new Vector3();

const _color = new Color();

function ParserState() {

    const state = {
        objects: [],
        object: {},

        vertices: [],
        normals: [],
        colors: [],
        uvs: [],

        materials: {},
        materialLibraries: [],

        startObject: function ( name, fromDeclaration ) {

            if ( this.object && this.object.fromDeclaration === false ) {
                this.object.name = name;
                this.object.fromDeclaration = ( fromDeclaration !== false );
                return;
            }

            const previousMaterial = ( this.object && typeof this.object.currentMaterial === 'function' ? this.object.currentMaterial() : undefined );

            if ( this.object && typeof this.object._finalize === 'function' ) {
                this.object._finalize( true );
            }

            this.object = {
                name: name || '',
                fromDeclaration: ( fromDeclaration !== false ),
                geometry: {
                    vertices: [],
                    normals: [],
                    colors: [],
                    uvs: [],
                    hasUVIndices: false,
                    type: 'Mesh'
                },
                materials: [],
                smooth: true,

                startMaterial: function ( name, libraries ) {
                    const previous = this._finalize( false );

                    if ( previous && ( previous.inherited || previous.groupCount <= 0 ) ) {
                        this.materials.splice( previous.index, 1 );
                    }

                    const material = {
                        index: this.materials.length,
                        name: name || '',
                        mtllib: ( Array.isArray( libraries ) && libraries.length > 0 ? libraries[ libraries.length - 1 ] : '' ),
                        smooth: ( previous !== undefined ? previous.smooth : this.smooth ),
                        groupStart: ( previous !== undefined ? previous.groupEnd : 0 ),
                        groupEnd: -1,
                        groupCount: -1,
                        inherited: false,
                        clone: function ( index ) {
                            const cloned = {
                                index: ( typeof index === 'number' ? index : this.index ),
                                name: this.name,
                                mtllib: this.mtllib,
                                smooth: this.smooth,
                                groupStart: 0,
                                groupEnd: -1,
                                groupCount: -1,
                                inherited: false
                            };
                            cloned.clone = this.clone.bind( cloned );
                            return cloned;
                        }
                    };

                    this.materials.push( material );
                    return material;
                },

                currentMaterial: function () {
                    if ( this.materials.length > 0 ) return this.materials[ this.materials.length - 1 ];
                    return undefined;
                },

                _finalize: function ( end ) {
                    const lastMultiMaterial = this.currentMaterial();
                    if ( lastMultiMaterial && lastMultiMaterial.groupEnd === -1 ) {
                        lastMultiMaterial.groupEnd = this.geometry.vertices.length / 3;
                        lastMultiMaterial.groupCount = lastMultiMaterial.groupEnd - lastMultiMaterial.groupStart;
                        lastMultiMaterial.inherited = false;
                    }

                    if ( end && this.materials.length > 1 ) {
                        for ( let mi = this.materials.length - 1; mi >= 0; mi-- ) {
                            if ( this.materials[mi].groupCount <= 0 ) this.materials.splice( mi, 1 );
                        }
                    }

                    if ( end && this.materials.length === 0 ) {
                        this.materials.push({ name: '', smooth: this.smooth });
                    }

                    return lastMultiMaterial;
                }
            };

            if ( previousMaterial && previousMaterial.name && typeof previousMaterial.clone === 'function' ) {
                const declared = previousMaterial.clone( 0 );
                declared.inherited = true;
                this.object.materials.push( declared );
            }

            this.objects.push( this.object );
        },

        finalize: function () {
            if ( this.object && typeof this.object._finalize === 'function' ) this.object._finalize( true );
        },

        parseVertexIndex: function ( value, len ) {
            const index = parseInt( value, 10 );
            return ( index >= 0 ? index - 1 : index + len / 3 ) * 3;
        },

        parseNormalIndex: function ( value, len ) {
            const index = parseInt( value, 10 );
            return ( index >= 0 ? index - 1 : index + len / 3 ) * 3;
        },

        parseUVIndex: function ( value, len ) {
            const index = parseInt( value, 10 );
            return ( index >= 0 ? index - 1 : index + len / 2 ) * 2;
        },

        addVertex: function ( a, b, c ) {
            const src = this.vertices;
            const dst = this.object.geometry.vertices;
            dst.push( src[a+0], src[a+1], src[a+2] );
            dst.push( src[b+0], src[b+1], src[b+2] );
            dst.push( src[c+0], src[c+1], src[c+2] );
        },

        addColor: function ( a, b, c ) {
            const src = this.colors;
            const dst = this.object.geometry.colors;
            if ( src[a] !== undefined ) dst.push( src[a+0], src[a+1], src[a+2] );
            if ( src[b] !== undefined ) dst.push( src[b+0], src[b+1], src[b+2] );
            if ( src[c] !== undefined ) dst.push( src[c+0], src[c+1], src[c+2] );
        }
    };

    state.startObject( '', false );

    return state;
}

class OBJLoader extends Loader {

    constructor( manager ) {
        super( manager );
        this.materials = null;
    }

    load( url, onLoad, onProgress, onError ) {
        const scope = this;
        const loader = new FileLoader( this.manager );
        loader.setPath( this.path );
        loader.setRequestHeader( this.requestHeader );
        loader.setWithCredentials( this.withCredentials );
        loader.load( url, function ( text ) {
            try {
                onLoad( scope.parse( text ) );
            } catch ( e ) {
                if ( onError ) {
                    onError( e );
                } else {
                    console.error( e );
                }
                scope.manager.itemError( url );
            }
        }, onProgress, onError );
    }

    setMaterials( materials ) {
        this.materials = materials;
        return this;
    }

    parse( text ) {
        const state = new ParserState();

        if ( text.indexOf( '\r\n' ) !== -1 ) text = text.replace( /\r\n/g, '\n' );
        if ( text.indexOf( '\\\n' ) !== -1 ) text = text.replace( /\\\n/g, '' );

        const lines = text.split( '\n' );
        let result = [];

        for ( let i = 0, l = lines.length; i < l; i++ ) {
            const line = lines[i].trimStart();
            if ( line.length === 0 ) continue;
            const lineFirstChar = line.charAt(0);

            if ( lineFirstChar === '#' ) continue;

            if ( lineFirstChar === 'v' ) {
                const data = line.split( _face_vertex_data_separator_pattern );
                switch ( data[0] ) {
                    case 'v':
                        state.vertices.push( parseFloat(data[1]), parseFloat(data[2]), parseFloat(data[3]) );
                        if ( data.length >= 7 ) {
                            _color.setRGB( parseFloat(data[4]), parseFloat(data[5]), parseFloat(data[6]) ).convertSRGBToLinear();
                            state.colors.push( _color.r, _color.g, _color.b );
                        } else {
                            state.colors.push( undefined, undefined, undefined );
                        }
                        break;
                }
            }
        }

        state.finalize();

        const container = new Group();
        container.materialLibraries = [].concat( state.materialLibraries );

        const hasPrimitives = !( state.objects.length === 1 && state.objects[0].geometry.vertices.length === 0 );

        if ( hasPrimitives ) {

            for ( let i = 0, l = state.objects.length; i < l; i++ ) {
                const object = state.objects[i];
                const geometry = object.geometry;
                const materials = object.materials;
                let mesh;

                if ( geometry.vertices.length === 0 ) continue;

                const buffergeometry = new BufferGeometry();
                buffergeometry.setAttribute( 'position', new Float32BufferAttribute( geometry.vertices, 3 ) );

                if ( geometry.colors.length > 0 ) {
                    buffergeometry.setAttribute( 'color', new Float32BufferAttribute( geometry.colors, 3 ) );
                }

                const material = new MeshPhongMaterial({ vertexColors: geometry.colors.length > 0 });

                mesh = new Mesh( buffergeometry, material );
                mesh.name = object.name;
                container.add( mesh );
            }

        } else {
            if ( state.vertices.length > 0 ) {

                const instanceCount = state.vertices.length / 3;

                const sphereGeometry = new BufferGeometry();
                sphereGeometry.setAttribute( 'position', new Float32BufferAttribute([0,0,0],3) );

                const material = new MeshPhongMaterial({ color: 0xffffff });

                const instancedMesh = new InstancedMesh( sphereGeometry, material, instanceCount );

                const dummy = new Object3D();

                for ( let i = 0; i < instanceCount; i++ ) {
                    const x = state.vertices[i*3 + 0];
                    const y = state.vertices[i*3 + 1];
                    const z = state.vertices[i*3 + 2];
                    dummy.position.set(x, y, z);
                    dummy.updateMatrix();
                    instancedMesh.setMatrixAt(i, dummy.matrix);
                }

                if ( state.colors.length > 0 && state.colors[0] !== undefined ) {
                    const colorAttribute = new Float32BufferAttribute(state.colors, 3);
                    instancedMesh.instanceColor = colorAttribute;
                }

                container.add(instancedMesh);

            }
        }

        return container;

    }

}

export { OBJLoader };