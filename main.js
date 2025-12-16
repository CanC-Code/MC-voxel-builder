// Wait until DOM is ready
window.addEventListener('DOMContentLoaded', () => {

    // Primitives
    document.getElementById('newCube').onclick = createCube;
    document.getElementById('newSphere').onclick = createSphere;

    // Export
    document.getElementById('exportBtn').onclick = () => {
        if (!baseObject) return setStatus('No object to export');
        setStatus('Exporting GLB...');
        const exporter = new THREE.GLTFExporter();
        exporter.parse(baseObject, (gltf) => {
            const blob = new Blob([gltf], { type: 'model/gltf-binary' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'model.glb';
            link.click();
            setStatus('Exported GLB');
        }, { binary: true });
    };

    // Voxelize stub
    document.getElementById('convertBtn').onclick = () => {
        if (!baseObject) return setStatus('No object to voxelize');
        setStatus('Voxelize and export: Not implemented yet');
    };

    // Tool placeholders
    document.getElementById('paintBtn').onclick = () => setStatus('Paint mode: Coming soon');
    document.getElementById('scaleBtn').onclick = () => setStatus('Scale tool: Coming soon');
    document.getElementById('moveBtn').onclick = () => setStatus('Move tool: Coming soon');

});