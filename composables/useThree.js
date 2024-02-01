
import { Mesh, MeshStandardMaterial, MeshBasicMaterial, Color } from 'three';
const useThree = () => {
  const createModel = ({ geometry, color, positionY, scale, rotation, name }) => {
    const mesh = new Mesh(geometry, new MeshStandardMaterial({ color: new Color(color) }));
    if (typeof positionY === 'number') mesh.position.set(-40, positionY, 0);
    if (scale) mesh.scale.copy(scale);
    if (rotation) mesh.rotation.set(rotation.x, rotation.y, rotation.z);
    mesh.name = name;
    return mesh
  };

  const createFadeMesh = (geometry, color) => {
    return new Mesh(geometry, new MeshBasicMaterial({ transparent: true, opacity: 0, color: new Color(color) }))
  }

  return { createModel, createFadeMesh }
}

export default useThree;