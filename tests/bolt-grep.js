const src=require('fs').readFileSync(require('path').join(__dirname,'../assets/pet.js'),'utf8');
const facts=eval(src.match(/var facts = (\[[\s\S]*?\n  \]);/)[1]);
var stop=" the and has have had does did what how many much who for with about his him is are was can you tell any done ";function words(t){return (t.toLowerCase().match(/[a-z0-9]+/g)||[]).filter(w=>w.length>2&&stop.indexOf(" "+w+" ")<0)}
function grep(q){var qs=words(q).filter(w=>w.length>2),best=null,top=0;facts.forEach(f=>{var k=words(f[0]),b=words(f[1]),n=0;qs.forEach(w=>{n+=k.indexOf(w)>=0?2:b.indexOf(w)>=0?1:0});if(n>top){top=n;best=f}});return best}
const cases={"has he done RAG?":"RAG","is he available for freelance?":"UTC+5","what backend stack?":"FastAPI","how many years experience":"5 years","what is the weather":null,"does he know prompt injection":"114","can he build backend apis fast":"FastAPI"};
for(const[q,exp] of Object.entries(cases)){const b=grep(q);const ok=exp===null?!b:b&&b[1].includes(exp);console.log(ok?'PASS':'FAIL',q,'->',b&&b[1].slice(0,50));if(!ok)process.exitCode=1}
