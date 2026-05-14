// position and uv are auto-injected by Three.js ShaderMaterial — no attribute declaration needed
// instanceOffset, windPhase are set via InstancedBufferAttribute in Foliage.tsx

attribute vec3 instanceOffset;
attribute float windPhase;     // per-blade phase offset for wind variation

varying vec2 TexCoord;
varying vec3 WorldPos;
varying float HeightFactor;
varying float WindInfluence;

uniform float time;

vec2 hash(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

float noise(in vec2 p) {
    const float K1 = 0.366025404;
    const float K2 = 0.211324865;
    vec2 i = floor(p + (p.x + p.y) * K1);
    vec2 a = p - i + (i.x + i.y) * K2;
    vec2 o = (a.x > a.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec2 b = a - o + K2;
    vec2 c = a - 1.0 + 2.0 * K2;
    vec3 h = max(0.5 - vec3(dot(a, a), dot(b, b), dot(c, c)), 0.0);
    vec3 n = h * h * h * h * vec3(dot(a, hash(i)), dot(b, hash(i + o)), dot(c, hash(i + 1.0)));
    return dot(n, vec3(70.0));
}

void main() {
    // uv.y goes 0 (base) → 1 (tip) — drives wind bend and colour
    TexCoord = uv;

    float dist = length(cameraPosition - instanceOffset);
    float scale = 1.0;
    if (dist > 15.0) {
        scale = mix(1.0, 0.7, clamp((dist - 15.0) / 30.0, 0.0, 1.0));
    }

    float windSpeed    = 1.2;
    float windStrength = 0.25;
    vec2 windUV = instanceOffset.xz * 0.5 + time * windSpeed * vec2(0.6, 0.4);
    float wind1    = noise(windUV) * 0.5 + 0.5;
    float wind2    = noise(windUV * 2.5 + time * 0.8) * 0.5 + 0.5;
    float wind3    = noise(windUV * 0.8 - time * 0.3) * 0.5 + 0.5;
    float windNoise = (wind1 * 0.5 + wind2 * 0.3 + wind3 * 0.2) - 0.5;

    // Quadratic: tips bend more than base
    float heightInfluence = position.y * position.y;

    vec2 windDirection = vec2(
        windNoise * windStrength * heightInfluence,
        windNoise * windStrength * 0.6 * heightInfluence);

    // Per-blade variation via windPhase attribute
    float bladeVariation = fract(sin(windPhase) * 43758.5453);
    windDirection *= 0.8 + bladeVariation * 0.4;

    vec3 windOffset        = vec3(windDirection.x, 0.0, windDirection.y);
    vec3 instancePosWithWind = instanceOffset + windOffset;

    // Y-locked cylindrical billboard
    vec3 toCamera = normalize(cameraPosition - instancePosWithWind);
    toCamera.y    = 0.0;
    toCamera      = normalize(toCamera);
    vec3 up    = vec3(0.0, 1.0, 0.0);
    vec3 right = normalize(cross(up, toCamera));

    vec3 worldPos = instancePosWithWind
    + right * (position.x * scale)
    + up    * (position.y * scale);

    WorldPos      = worldPos;
    HeightFactor  = uv.y;           // 0→1 tip fraction
    WindInfluence = (wind1 + wind2) * 0.5;

    gl_Position = projectionMatrix * viewMatrix * vec4(worldPos, 1.0);
}