varying vec2 TexCoord;
varying vec3 WorldPos;
varying float HeightFactor;
varying float WindInfluence;

uniform sampler2D grassTexture;
uniform vec3 lightDir;
uniform float time;

void main() {
    vec4 texColor = texture2D(grassTexture, TexCoord);  // texture2D not texture
    float alpha = texColor.r;
    if (alpha < 0.2) discard;

    // lightDir may be zero if not passed — use a safe fallback
    vec3 safeLight = length(lightDir) > 0.001 ? normalize(-lightDir) : vec3(0.0, 1.0, 0.0);
    vec3 normal = vec3(0.0, 1.0, 0.0);
    float lightIntensity = dot(safeLight, normal) * 0.5 + 0.5;

    float windShimmer = WindInfluence * HeightFactor * 0.15;
    lightIntensity += windShimmer;

    vec3 windTint = vec3(0.1, 0.15, 0.05) * WindInfluence * HeightFactor * 0.2;

    vec3 baseColor = mix(GRASS_DARK, GRASS_MID, HeightFactor * 0.5);
    if (HeightFactor > 0.7) {
        baseColor = mix(GRASS_MID, GRASS_TIP, (HeightFactor - 0.7) / 0.3);
    }
    baseColor += windTint;

    vec3 color = celShadeSmoothBands(lightIntensity, baseColor * 0.7, baseColor * 1.2, 4.0);

    if (HeightFactor > 0.8 && WindInfluence > 0.6) {
        color += vec3(0.1, 0.12, 0.08) * (HeightFactor - 0.8) * 2.0;
    }

    gl_FragColor = vec4(color, alpha);
}