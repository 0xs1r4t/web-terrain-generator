varying vec3 TexCoords;

void main() {
    TexCoords = position;
    mat4 rotView = mat4(mat3(viewMatrix));
    vec4 pos = projectionMatrix * rotView * vec4(position, 1.0);
    gl_Position = pos.xyww; // Trick to set depth to 1.0
}
