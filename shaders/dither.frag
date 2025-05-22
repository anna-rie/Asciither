precision mediump float;

uniform sampler2D bgl_RenderedTexture;
uniform float u_scale;
varying vec2 vUv;

int getDitherValue(int x, int y) {
    int dither[64];
    dither[ 0] =  0; dither[ 1] = 32; dither[ 2] =  8; dither[ 3] = 40;
    dither[ 4] =  2; dither[ 5] = 34; dither[ 6] = 10; dither[ 7] = 42;
    dither[ 8] = 48; dither[ 9] = 16; dither[10] = 56; dither[11] = 24;
    dither[12] = 50; dither[13] = 18; dither[14] = 58; dither[15] = 26;
    dither[16] = 12; dither[17] = 44; dither[18] =  4; dither[19] = 36;
    dither[20] = 14; dither[21] = 46; dither[22] =  6; dither[23] = 38;
    dither[24] = 60; dither[25] = 28; dither[26] = 52; dither[27] = 20;
    dither[28] = 62; dither[29] = 30; dither[30] = 54; dither[31] = 22;
    dither[32] =  3; dither[33] = 35; dither[34] = 11; dither[35] = 43;
    dither[36] =  1; dither[37] = 33; dither[38] =  9; dither[39] = 41;
    dither[40] = 51; dither[41] = 19; dither[42] = 59; dither[43] = 27;
    dither[44] = 49; dither[45] = 17; dither[46] = 57; dither[47] = 25;
    dither[48] = 15; dither[49] = 47; dither[50] =  7; dither[51] = 39;
    dither[52] = 13; dither[53] = 45; dither[54] =  5; dither[55] = 37;
    dither[56] = 63; dither[57] = 31; dither[58] = 55; dither[59] = 23;
    dither[60] = 61; dither[61] = 29; dither[62] = 53; dither[63] = 21;

    int index = y * 8 + x;
    return dither[index];
}

float find_closest(int x, int y, float c0) {
    float limit = float(getDitherValue(x, y) + 1) / 64.0;
    return (c0 < limit) ? 0.0 : 1.0;
}

void main(void) {
    vec4 color = texture2D(bgl_RenderedTexture, vUv);
    vec3 rgb = color.rgb;

    vec2 screenCoord = gl_FragCoord.xy * u_scale;
    int x = int(mod(screenCoord.x, 8.0));
    int y = int(mod(screenCoord.y, 8.0));

    vec3 finalRGB;
    finalRGB.r = find_closest(x, y, rgb.r);
    finalRGB.g = find_closest(x, y, rgb.g);
    finalRGB.b = find_closest(x, y, rgb.b);

    gl_FragColor = vec4(finalRGB, 1.0);
}
