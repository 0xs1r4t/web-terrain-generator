attribute vec3 WorldPos;

uniform sampler2D environmentMap;

const vec2 invAtan = vec2(0.1591, 0.3183);

vec2 SampleSphericalMap(vec3 v) {
    // Convert 3D direction to equirectangular UV coordinates
    vec2 uv = vec2(atan(v.z, v.x), asin(v.y));
    uv *= invAtan;
    uv += 0.5;
    return uv;
}

void main() {
    vec2 uv = SampleSphericalMap(normalize(WorldPos));
    vec3 color = texture(environmentMap, uv).rgb;

    // Tone mapping (simple Reinhard)
    color = color / (color + vec3(1.0));

    // Gamma correction
    color = pow(color, vec3(1.0/2.2));

    gl_FragColor = vec4(color, 1.0);
}