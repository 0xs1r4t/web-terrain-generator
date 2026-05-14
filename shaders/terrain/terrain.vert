varying vec3 FragPos;
varying vec3 Normal;
varying vec2 TexCoords;
varying vec3 VertexColor;

void main() {
    FragPos     = vec3(modelMatrix * vec4(position, 1.0));
    Normal      = normalMatrix * normal;
    TexCoords   = uv;
    VertexColor = color;

    gl_Position = projectionMatrix * viewMatrix * vec4(FragPos, 1.0);
}