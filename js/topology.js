export function ensureTopology(geometry) {
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();

  if (!geometry.attributes.normal) {
    geometry.computeVertexNormals();
  }

  geometry.attributes.position.setUsage(35048); // DynamicDrawUsage
}