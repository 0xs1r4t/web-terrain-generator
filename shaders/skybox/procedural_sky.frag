varying vec3 TexCoords;

uniform float time;
uniform vec3 moonDir;

float hash3(vec3 p) {
    p = fract(p * vec3(443.537, 537.247, 247.428));
    p += dot(p, p.yxz + 19.19);
    return fract((p.x + p.y) * p.z);
}

float stars(vec3 rd) {
    if (rd.y < 0.0) return 0.0;
    vec3 p = rd * 500.0;
    vec3 c = floor(p);
    float h = hash3(c);
    float star = step(0.999, h);
    float brightness = hash3(c * 1.234) * 0.5 + 0.5;
    brightness *= 0.8 + 0.2 * sin(time * 3.0 + h * 100.0);
    return star * brightness * 0.5;
}

vec3 skyGradient(vec3 rd) {
    vec3 zenithColor  = vec3(0.05, 0.05, 0.15);
    vec3 horizonColor = vec3(0.15, 0.10, 0.25);
    vec3 nadirColor   = vec3(0.02, 0.02, 0.08);
    vec3 sky = mix(nadirColor,  horizonColor, smoothstep(-0.2, 0.1, rd.y));
    sky      = mix(sky,         zenithColor,  smoothstep(0.1,  0.8, rd.y));
    return sky;
}

vec3 renderMoon(vec3 rd, vec3 md) {
    vec3 col = vec3(0.0);
    float moonSize  = 0.035;
    vec3 moonColor  = vec3(1.0, 0.95, 0.85);
    float dist      = length(rd - md);
    float moon      = smoothstep(moonSize * 1.05, moonSize * 0.95, dist);
    if (moon > 0.01) {
        float edgeDist  = dist / moonSize;
        float brightness = 1.0 - smoothstep(0.0, 1.0, edgeDist);
        brightness = pow(brightness, 0.6);
        float shading = mix(0.6, 1.0, brightness);
        col += moon * moonColor * shading;
    }
    float glow = exp(-dist * 12.0) * 0.25;
    col += glow * moonColor * 0.3;
    return col;
}

void main() {
    vec3 rd = normalize(TexCoords);

    vec3 col = skyGradient(rd);

    float starField = stars(rd);
    col += vec3(starField * 2.5, starField * 2.2, starField * 2.8);

    col += renderMoon(rd, normalize(moonDir));

    float horizonGlow = exp(-max(abs(rd.y), 0.0) * 4.0) * 0.06;
    col += vec3(0.15, 0.12, 0.25) * horizonGlow;

    col = pow(col, vec3(0.9));
    col = clamp(col, 0.0, 1.0);

    gl_FragColor = vec4(col, 1.0);
}