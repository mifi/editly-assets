/*
 * Original shader from: https://www.shadertoy.com/view/wd2yDm
 */

#ifdef GL_ES
precision mediump float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;

// shadertoy emulation
#define iTime time
#define iResolution resolution

// --------[ Original ShaderToy begins here ]---------- //
float st=.02, maxdist=8.,m,mc;
vec3 ldir=vec3(-.5,-1.,-1.);

mat2 rot(float a) {
	float s=sin(a),c=cos(a);
    return mat2(c,s,-s,c);
}

float map(vec2 p) {
    float s=0.;
    m=mc=100.;
    float l2=0.;
    float y=(sin(p.x+cos(p.y*2.)+2.724)+cos(p.y))*8.;
    vec2 mcol=vec2(100.);
	p=abs(.5-fract(p*.03));
    y+=smoothstep(.5,.4,length(p.xy))*10.;
    vec2 pos=p;
    for (int i=0; i<6; i++) {
    	p=abs(p+1.)-abs(p-1.)-p;
        float l=dot(p,p);
        p=p*2./clamp(l,.25,1.)-pos;
        s+=exp(-.3*abs(l-l2));
        l2=l;
        if (i>2 && i<5) m=min(min(abs(p.y),abs(p.x)),m);
        mc=min(mc,l);
    }
    m=pow(max(0.,1.-m),6.);
    return (y+s)*.05-m*.1;
}


vec3 normal(vec2 p) {
	vec2 eps=vec2(0.,.01);
    return normalize(vec3(map(p+eps.yx)-map(p-eps.yx),2.*eps.y,map(p+eps.xy)-map(p-eps.xy)));
}

vec2 hit(vec3 p) {
    float h=map(p.xz);
    return vec2(step(p.y,h),h);
}

float fog(vec3 p,float h) {
    p.y=p.y*2.-1.-h*1.5;
    p.x+=p.z*1.234+iTime*.5;
	p=abs(2.-mod(p,4.));
    for (int i=0; i<10; i++) {
    	p=abs(p)/dot(p,p)-.8;
    }
    return length(p);
}

vec3 bsearch(vec3 from, vec3 dir, float td) {
    vec3 p;
    st*=-.5;
    td+=st;
    float h2=1.;
    for (int i=0; i<20; i++) {
        p=from+td*dir;
        float h=hit(p).x;
        if (abs(h-h2)>.001) {
            st*=-.5;
	        h2=h;
        }
        td+=st;
    }
	return p;
}

vec3 shade(vec3 p, vec3 dir, float h) {
    vec3 col=vec3(1.,0.,0.)*m*pow(smoothstep(.3,.5,abs(.5-fract(mc*.5+h*.5+iTime*.5))),2.);
    ldir=normalize(ldir);
	vec3 n=normal(p.xz);
    vec3 ref=reflect(dir,ldir);
    float spe=pow(max(0.,dot(ref,-n))*.5,3.)*2.5;
    return col+spe;
}


vec3 march(vec3 from, vec3 dir) {
	vec3 p, col=vec3(0.);
    float td=1., k=0.;
    vec2 h;
    for (int i=0; i<350; i++) {
    	p=from+dir*td;
        h=hit(p);
        k+=fog(p,h.y)*pow(max(0.,1.-abs(p.y-h.y)*.25),2.);
        if (h.x > .5 || td>maxdist) break;
        td+=st;
    }
    float f=pow(td/maxdist,2.);
    if (h.x > .5) {
        p=bsearch(from, dir, td);
    	col=shade(p,dir,h.y);
    } 
	col=mix(col,vec3(.2*(1.-p.y*.25)),f)*min(1.,iTime*.5);
    return col*vec3(1.,.9,.8)+k*.0007;
}

mat3 lookat(vec3 dir, vec3 up) {
	dir=normalize(dir);vec3 rt=normalize(cross(dir,normalize(up)));
    return mat3(rt,cross(rt,dir),dir);
}

vec3 path(float t) {
	return vec3(sin(t*.2645)+cos(t*.1213)*2.,2.5+sin(t*.354)*.2,t);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = (fragCoord-iResolution.xy*.5)/iResolution.y;
	float t=iTime+15.;
    vec3 from=path(t);
    vec3 dir=normalize(vec3(uv,1.));
    vec3 adv=from-path(t-1.);
    dir=lookat(adv+vec3(0.,-.5,0.),vec3(adv.x*.3,1.,0.))*dir;
    vec3 col=march(from, dir);
    fragColor = vec4(col,1.);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
