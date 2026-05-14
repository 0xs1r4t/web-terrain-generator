varying vec2 TexCoord;
varying vec3 WorldPos;
varying float HeightFactor;
varying float WindInfluence;

uniform sampler2D grassTexture;
uniform vec3 lightDir;
uniform float time;
uniform vec3 ambientColor;

void main() {
    vec4 texColor = texture2D(grassTexture, TexCoord);
    float alpha = texColor.r;
    if (alpha < 0.2) discard;

    vec3 normal = vec3(0.0, 1.0, 0.0);
    float lightIntensity = dot(normalize(-lightDir), normal) * 0.5 + 0.5;

    float windShimmer = WindInfluence * HeightFactor * 0.15;
    lightIntensity += windShimmer;

    vec3 windTint = vec3(0.1, 0.15, 0.05) * WindInfluence * HeightFactor * 0.2;

    vec3 baseColor = mix(GRASS_DARK, GRASS_MID, HeightFactor * 0.5);
    if (HeightFactor > 0.7) {
        baseColor = mix(GRASS_MID, GRASS_TIP, (HeightFactor - 0.7) / 0.3);
    }
    baseColor += windTint;

    vec3 colour = celShadeSmoothBands(lightIntensity, baseColor * 0.7, baseColor * 1.2, 4.0);

    if (HeightFactor > 0.8 && WindInfluence > 0.6) {
        colour += vec3(0.1, 0.12, 0.08) * (HeightFactor - 0.8) * 2.0;
    }

    gl_FragColor = vec4(colour, alpha);
}