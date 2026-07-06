import{j as e,r as React}from"./vendor-react-CTJUxz_o.js";
import{u as useTrainerContext,d as usePokemonContext,f as useGameData,h as typeColor,k as pokemonImage,E as parseDice,N as critThreshold,l as stabBonus,t as toast,x as typeMatchups}from"./app-core-passives15.js";

const selectStyle={width:"100%",padding:"9px 10px",borderRadius:"6px",border:"1px solid var(--border-medium)",background:"var(--input-bg)",color:"var(--text-primary)",font:"inherit"};
const rollDie=sides=>Math.floor(Math.random()*sides)+1;
const displayName=pokemon=>pokemon?.name||pokemon?.species||"Pokemon";
const effectivenessAgainst=(moveType,target)=>{const chart=typeMatchups(target?.types||[]);if(chart.immune.includes(moveType))return{label:"Immune",diceDelta:0,immune:true};if(chart.superWeak.includes(moveType))return{label:"Extremely-effective",diceDelta:2,immune:false};if(chart.weak.includes(moveType))return{label:"Super-effective",diceDelta:1,immune:false};if(chart.superResist.includes(moveType))return{label:"Shielded",diceDelta:-2,immune:false};if(chart.resist.includes(moveType))return{label:"Resisted",diceDelta:-1,immune:false};return{label:"Neutral",diceDelta:0,immune:false}};
const AFFLICTIONS={asleep:{label:"Asleep",dc:16,description:"Save vs 16 to wake; DC drops by 2 after each failure (minimum 6)."},burned:{label:"Burned",description:"-2 ATK and 1d10 HP after taking an action."},confused:{label:"Confused",dc:11,description:"Save vs 11 to act; 16+ cures. Failure deals 1d12 HP."},cursed:{label:"Cursed",description:"Lose 1/6 maximum HP after taking an action."},frozen:{label:"Frozen",dc:18,description:"Save vs 18 to thaw and act."},infatuated:{label:"Infatuated",dc:13,description:"Save vs 13 to attack this target; 19+ cures."},paralyzed:{label:"Paralyzed",dc:6,description:"-2 SPD. Save to act; DC rises by 2 after failure (maximum 16)."},poisoned:{label:"Poisoned",description:"-2 SPATK and 1d10 HP after taking an action."},toxified:{label:"Toxified",description:"-2 SPATK. Action damage escalates: 1d8, 1d12, 1d20, 2d20, 3d20..."},stunned:{label:"Stunned",description:"Lose the next turn, then recover."}};
const afflictionImmune=(type,pokemon)=>type==="burned"?pokemon?.types?.includes("Fire"):type==="frozen"?pokemon?.types?.includes("Ice"):(type==="poisoned"||type==="toxified")?pokemon?.types?.some(value=>value==="Poison"||value==="Steel"):false;
const detectAffliction=(effect,d20)=>{const text=(effect||"").toLowerCase(),patterns=[["toxified",/toxif|badly poison/],["poisoned",/poison/],["asleep",/asleep|sleep/],["burned",/burn/],["confused",/confus/],["cursed",/curs/],["frozen",/frozen|freeze/],["infatuated",/infatuat/],["paralyzed",/paraly/],["stunned",/stun/]];for(const[type,pattern]of patterns){const match=pattern.exec(text);if(!match)continue;const before=text.slice(Math.max(0,match.index-24),match.index),range=before.match(/(\d{1,2})(?:\s*-\s*(\d{1,2}))?\D*$/);if(range){const low=Number(range[1]),high=Number(range[2]||range[1]);if(d20<low||d20>high)return null}return type}return null};

function BattleMode(){
  const{trainers,setTrainers}=useTrainerContext();
  const{calculatePokemonMaxHP,getActualStats}=usePokemonContext();
  const{GAME_DATA}=useGameData();
  const[leftTrainerId,setLeftTrainerId]=React.useState("");
  const[rightTrainerId,setRightTrainerId]=React.useState("");
  const[leftPokemonId,setLeftPokemonId]=React.useState("");
  const[rightPokemonId,setRightPokemonId]=React.useState("");
  const[log,setLog]=React.useState([]);

  React.useEffect(()=>{
    if(!trainers.length)return;
    setLeftTrainerId(value=>value||String(trainers[0].id));
    setRightTrainerId(value=>value||String((trainers[1]||trainers[0]).id));
  },[trainers]);

  const trainerById=id=>trainers.find(trainer=>String(trainer.id)===String(id));
  const pokemonFor=trainer=>[...(trainer?.party||[]),...(trainer?.reserve||[])];
  const leftTrainer=trainerById(leftTrainerId);
  const rightTrainer=trainerById(rightTrainerId);
  const leftPokemon=pokemonFor(leftTrainer).find(pokemon=>String(pokemon.id)===String(leftPokemonId));
  const rightPokemon=pokemonFor(rightTrainer).find(pokemon=>String(pokemon.id)===String(rightPokemonId));

  React.useEffect(()=>{
    const available=pokemonFor(leftTrainer);
    if(!available.some(pokemon=>String(pokemon.id)===String(leftPokemonId)))setLeftPokemonId(available[0]?String(available[0].id):"");
  },[leftTrainerId,trainers]);
  React.useEffect(()=>{
    const available=pokemonFor(rightTrainer);
    if(!available.some(pokemon=>String(pokemon.id)===String(rightPokemonId))){
      const alternative=available.find(pokemon=>String(pokemon.id)!==String(leftPokemonId))||available[0];
      setRightPokemonId(alternative?String(alternative.id):"");
    }
  },[rightTrainerId,trainers,leftPokemonId]);

  const hp=pokemon=>{
    if(!pokemon)return{current:0,max:0};
    const max=calculatePokemonMaxHP(pokemon);
    return{current:Math.max(0,max-(pokemon.currentDamage||0)),max};
  };
  const stats=pokemon=>pokemon?getActualStats(pokemon):{};
  const resolveMove=move=>{
    const base=typeof move==="string"?{name:move}:move||{};
    const database=GAME_DATA?.moves?.[base.name]||{};
    return{...database,...base,name:base.name||"Move"};
  };
  const updatePokemon=(trainerId,pokemonId,updater)=>setTrainers(current=>current.map(trainer=>{if(String(trainer.id)!==String(trainerId))return trainer;const update=list=>(list||[]).map(pokemon=>String(pokemon.id)===String(pokemonId)?updater(pokemon):pokemon);return{...trainer,party:update(trainer.party),reserve:update(trainer.reserve)}}));
  const updateDamage=(trainerId,pokemonId,amount)=>updatePokemon(trainerId,pokemonId,pokemon=>{const next=Math.max(0,(pokemon.currentDamage||0)+amount),max=calculatePokemonMaxHP(pokemon);return{...pokemon,currentDamage:next,battleAffliction:next>=max&&["burned","cursed","poisoned","toxified"].includes(pokemon.battleAffliction?.type)?null:pokemon.battleAffliction}});
  const restore=(trainerId,pokemonId)=>updatePokemon(trainerId,pokemonId,pokemon=>({...pokemon,currentDamage:0}));
  const combatStats=(pokemon,affliction=pokemon?.battleAffliction)=>{const value={...stats(pokemon)};if(affliction?.type==="burned")value.atk=Math.max(0,(value.atk||0)-2);if(affliction?.type==="paralyzed")value.spd=Math.max(0,(value.spd||0)-2);if(affliction?.type==="poisoned"||affliction?.type==="toxified")value.satk=Math.max(0,(value.satk||0)-2);return value};
  const statusLog=(pokemon,note)=>setLog(current=>[{id:Date.now()+Math.random(),kind:"status",pokemon:displayName(pokemon),note},...current].slice(0,30));
  const setAffliction=(trainerId,pokemon,type,automatic=false)=>{if(!type){updatePokemon(trainerId,pokemon.id,current=>({...current,battleAffliction:null}));return true}if(pokemon.battleAffliction&&!automatic){toast.warning(`${displayName(pokemon)} already has ${AFFLICTIONS[pokemon.battleAffliction.type]?.label}.`);return false}if(pokemon.battleAffliction)return false;if(afflictionImmune(type,pokemon)){toast.info(`${displayName(pokemon)} is immune to ${AFFLICTIONS[type].label}.`);statusLog(pokemon,`Immune to ${AFFLICTIONS[type].label}.`);return false}const definition=AFFLICTIONS[type],affliction={type,dc:definition.dc||null,turn:0,toxicStage:0,assisted:false};updatePokemon(trainerId,pokemon.id,current=>({...current,battleAffliction:affliction}));statusLog(pokemon,`${definition.label} applied.`);return true};
  const helpAffliction=(trainerId,pokemon)=>{const affliction=pokemon.battleAffliction;if(!affliction)return;if(affliction.type==="frozen"){const turns=(affliction.helpTurns||0)+1;if(turns>=3){updatePokemon(trainerId,pokemon.id,current=>({...current,battleAffliction:null}));statusLog(pokemon,"An ally finished thawing the ice over three turns.")}else{updatePokemon(trainerId,pokemon.id,current=>({...current,battleAffliction:{...affliction,helpTurns:turns}}));statusLog(pokemon,`Thawing help: ${turns}/3 turns.`)}return}updatePokemon(trainerId,pokemon.id,current=>({...current,battleAffliction:{...affliction,assisted:true}}));statusLog(pokemon,"An ally will add +5 to the next saving throw.")};
  const prepareAction=(pokemon,trainerId)=>{const affliction=pokemon.battleAffliction;if(!affliction)return{allowed:true,affliction:null};const type=affliction.type,assist=affliction.assisted?5:0,roll=()=>rollDie(20),clear=note=>{updatePokemon(trainerId,pokemon.id,current=>({...current,battleAffliction:null}));statusLog(pokemon,note);return{allowed:true,affliction:null}};if(type==="stunned"){updatePokemon(trainerId,pokemon.id,current=>({...current,battleAffliction:null}));statusLog(pokemon,"Stunned: turn lost, then recovered.");return{allowed:false,affliction:null}}if(["asleep","frozen","paralyzed","confused","infatuated"].includes(type)){const result=roll(),total=result+assist;if(type==="asleep"){if(total>=affliction.dc)return clear(`Asleep save ${total} vs ${affliction.dc}: woke up.`);const next={...affliction,dc:Math.max(6,affliction.dc-2),turn:(affliction.turn||0)+1,assisted:false};updatePokemon(trainerId,pokemon.id,current=>({...current,battleAffliction:next}));statusLog(pokemon,`Asleep save ${total} vs ${affliction.dc}: failed, turn lost. Next DC ${next.dc}.`);return{allowed:false,affliction:next}}if(type==="frozen"){if(total>=18)return clear(`Frozen save ${total} vs 18: thawed.`);statusLog(pokemon,`Frozen save ${total} vs 18: failed, turn lost.`);return{allowed:false,affliction:{...affliction,assisted:false}}}if(type==="paralyzed"){if(total>=affliction.dc){if(assist)updatePokemon(trainerId,pokemon.id,current=>({...current,battleAffliction:{...affliction,assisted:false}}));statusLog(pokemon,`Paralyzed save ${total} vs ${affliction.dc}: action allowed.`);return{allowed:true,affliction:{...affliction,assisted:false}}}const next={...affliction,dc:Math.min(16,affliction.dc+2),turn:(affliction.turn||0)+1,assisted:false};updatePokemon(trainerId,pokemon.id,current=>({...current,battleAffliction:next}));statusLog(pokemon,`Paralyzed save ${total} vs ${affliction.dc}: failed, turn lost. Next DC ${next.dc}.`);return{allowed:false,affliction:next}}if(type==="confused"){if(total>=16)return clear(`Confused save ${total}: cured.`);if(total>=11){const next={...affliction,assisted:false};if(assist)updatePokemon(trainerId,pokemon.id,current=>({...current,battleAffliction:next}));statusLog(pokemon,`Confused save ${total}: action allowed.`);return{allowed:true,affliction:next}}const damage=rollDie(12),next={...affliction,assisted:false};if(assist)updatePokemon(trainerId,pokemon.id,current=>({...current,battleAffliction:next}));updateDamage(trainerId,pokemon.id,damage);statusLog(pokemon,`Confused save ${total}: failed, lost ${damage} HP and the action.`);return{allowed:false,affliction:next}}if(type==="infatuated"){if(total>=19)return clear(`Infatuated save ${total}: cured.`);if(total>=13){statusLog(pokemon,`Infatuated save ${total}: attack allowed.`);return{allowed:true,affliction}}statusLog(pokemon,`Infatuated save ${total}: failed, attack prevented.`);return{allowed:false,affliction}}}return{allowed:true,affliction}};
  const afterAction=(pokemon,trainerId,affliction)=>{if(!affliction)return;let damage=0,note="";if(affliction.type==="burned"||affliction.type==="poisoned"){damage=rollDie(10);note=`${AFFLICTIONS[affliction.type].label}: ${damage} HP after action.`}else if(affliction.type==="cursed"){damage=Math.max(1,Math.floor(hp(pokemon).max/6));note=`Cursed: ${damage} HP (1/6 max HP) after action.`}else if(affliction.type==="toxified"){const stage=affliction.toxicStage||0,sides=stage===0?8:stage===1?12:20,count=stage<3?1:stage-1,rolls=Array.from({length:count},()=>rollDie(sides));damage=rolls.reduce((sum,value)=>sum+value,0);note=`Toxified stage ${stage+1}: ${count}d${sides} [${rolls.join(", ")}] = ${damage} HP.`;updatePokemon(trainerId,pokemon.id,current=>({...current,battleAffliction:current.battleAffliction?{...current.battleAffliction,toxicStage:stage+1}:null}))}if(damage){updateDamage(trainerId,pokemon.id,damage);statusLog(pokemon,note)}};
  const passTurn=(trainerId,pokemon)=>{if(pokemon.battleAffliction?.type==="stunned")updatePokemon(trainerId,pokemon.id,current=>({...current,battleAffliction:null}));statusLog(pokemon,pokemon.battleAffliction?.type==="stunned"?"Passed the lost Stunned turn and recovered.":"Passed the turn without moving; no affliction damage.")};

  const attack=(attacker,attackerTrainerId,target,targetTrainerId,moveInput)=>{
    if(!attacker||!target)return;
    if(hp(attacker).current<=0){toast.warning(`${displayName(attacker)} has fainted.`);return}
    if(hp(target).current<=0){toast.warning(`${displayName(target)} has already fainted.`);return}
    const action=prepareAction(attacker,attackerTrainerId);if(!action.allowed)return;
    const move=resolveMove(moveInput),category=move.category||"Physical",isPhysical=category==="Physical",isStatus=category==="Status";
    const attackKey=isPhysical?"atk":isStatus?"spd":"satk";
    const defenseKey=isPhysical?"def":isStatus?"spd":"sdef";
    const accuracyKey=isPhysical?"atk":isStatus?"eff":"satk";
    const attackerStats=combatStats(attacker,action.affliction),targetStats=combatStats(target);
    const attackStat=Number(attackerStats[attackKey]||0),defense=Number(targetStats[defenseKey]||0);
    const statModifier=Math.floor(attackStat/2),accuracyModifier=Number(attacker.accuracyMods?.[accuracyKey]||0);
    const d20=rollDie(20),accuracy=d20+statModifier+accuracyModifier;
    const threshold=critThreshold(move.effect||move.description||""),critical=d20>=threshold;
    const hit=critical||accuracy>=defense;
    const formula=parseDice(move.damage||""),effectiveness=effectivenessAgainst(move.type||"Normal",target);
    const originalDice=formula.count||0,adjustedDice=originalDice>0?Math.max(0,originalDice+effectiveness.diceDelta):0;
    let rolls=[],damage=0,stab=0;
    if(hit&&!effectiveness.immune&&!isStatus&&originalDice>0){
      rolls=critical?Array(adjustedDice).fill(formula.sides):Array.from({length:adjustedDice},()=>rollDie(formula.sides));
      stab=attacker.types?.includes(move.type)?stabBonus():0;
      damage=rolls.reduce((sum,value)=>sum+value,0)+(formula.bonus||0)+statModifier+stab;
      updateDamage(targetTrainerId,target.id,damage);
    }
    if(hit&&!effectiveness.immune&&move.type==="Fire"&&target.battleAffliction?.type==="frozen"){updatePokemon(targetTrainerId,target.id,current=>({...current,battleAffliction:null}));statusLog(target,"Thawed instantly by a Fire-type attack.")}
    const inflicted=hit&&!effectiveness.immune&&hp(target).current-damage>0?detectAffliction(move.effect||move.description||"",d20):null;if(inflicted)setAffliction(targetTrainerId,target,inflicted,true);
    const entry={id:Date.now()+Math.random(),attacker:displayName(attacker),target:displayName(target),move:move.name,type:move.type||"Normal",category,d20,accuracy,attackKey:attackKey.toUpperCase(),statModifier,defenseKey:defenseKey.toUpperCase(),defense,hit,critical,isStatus,rolls,formula:move.damage||"-",damage,effect:move.effect||move.description||"",effectiveness:effectiveness.label,diceDelta:effectiveness.diceDelta,immune:effectiveness.immune,originalDice,adjustedDice,dieSides:formula.sides||0};
    setLog(current=>[entry,...current].slice(0,30));
    afterAction(attacker,attackerTrainerId,action.affliction);
  };

  const Fighter=({side,trainer,trainerId,setTrainerId,pokemon,pokemonId,setPokemonId,opponent,opponentTrainerId})=>{
    const pokemonList=pokemonFor(trainer),health=hp(pokemon),pokemonStats=combatStats(pokemon),isFainted=pokemon&&health.current<=0;
    return e.jsxs("section",{className:"battle-mode-fighter",children:[
      e.jsx("div",{className:"battle-mode-side-label",children:side}),
      e.jsx("label",{children:[e.jsx("span",{children:"Trainer"}),e.jsx("select",{value:trainerId,onChange:event=>{setTrainerId(event.target.value);setPokemonId("")},style:selectStyle,children:trainers.filter(item=>!item.archived).map(item=>e.jsx("option",{value:String(item.id),children:item.name||"Unnamed Trainer"},item.id))})]}),
      e.jsx("label",{children:[e.jsx("span",{children:"Pokemon"}),e.jsxs("select",{value:pokemonId,onChange:event=>setPokemonId(event.target.value),style:selectStyle,children:[pokemonList.length===0&&e.jsx("option",{value:"",children:"No Pokemon available"}),pokemonList.map(item=>e.jsx("option",{value:String(item.id),children:`${displayName(item)}${(trainer.party||[]).some(p=>p.id===item.id)?" - Party":" - Reserve"}`},item.id))]})]}),
      pokemon&&e.jsxs(React.Fragment,{children:[
        e.jsxs("div",{className:"battle-mode-pokemon-head",children:[pokemonImage(pokemon)&&e.jsx("img",{src:pokemonImage(pokemon),alt:displayName(pokemon)}),e.jsxs("div",{children:[e.jsx("strong",{children:displayName(pokemon)}),e.jsx("div",{className:"text-muted",children:(pokemon.types||[]).join(" / ")})]}),e.jsx("button",{type:"button",className:"btn btn-secondary",onClick:()=>restore(trainer.id,pokemon.id),children:"Restore HP"})]}),
        e.jsxs("div",{className:"battle-mode-hp",children:[e.jsxs("div",{children:[e.jsx("strong",{children:`${health.current}/${health.max} HP`}),isFainted&&e.jsx("span",{children:"Fainted"})]}),e.jsx("div",{children:e.jsx("span",{style:{width:`${health.max?health.current/health.max*100:0}%`,background:health.current/health.max>.5?"#4caf50":health.current/health.max>.2?"#ff9800":"#e53935"}})})]}),
        e.jsxs("div",{className:"battle-mode-affliction",children:[e.jsxs("div",{className:"battle-mode-affliction-controls",children:[e.jsxs("select",{value:pokemon.battleAffliction?.type||"",disabled:!!pokemon.battleAffliction,onChange:event=>event.target.value&&setAffliction(trainer.id,pokemon,event.target.value),style:selectStyle,children:[e.jsx("option",{value:"",children:"Apply affliction..."}),Object.entries(AFFLICTIONS).map(([key,value])=>e.jsx("option",{value:key,disabled:afflictionImmune(key,pokemon),children:value.label},key))]}),e.jsx("button",{type:"button",className:"btn btn-secondary",disabled:!pokemon.battleAffliction,onClick:()=>setAffliction(trainer.id,pokemon,""),children:"Cure"}),e.jsx("button",{type:"button",className:"btn btn-secondary",onClick:()=>passTurn(trainer.id,pokemon),children:"Pass Turn"})]}),pokemon.battleAffliction&&e.jsxs("div",{className:`battle-mode-affliction-note ${pokemon.battleAffliction.type}`,children:[e.jsx("strong",{children:AFFLICTIONS[pokemon.battleAffliction.type].label}),e.jsx("span",{children:AFFLICTIONS[pokemon.battleAffliction.type].description}),pokemon.battleAffliction.dc&&e.jsx("span",{children:`Current save DC: ${pokemon.battleAffliction.dc}`}),["asleep","confused","frozen"].includes(pokemon.battleAffliction.type)&&e.jsx("button",{type:"button",className:"btn btn-secondary",disabled:pokemon.battleAffliction.assisted,onClick:()=>helpAffliction(trainer.id,pokemon),children:pokemon.battleAffliction.type==="frozen"?`Help thaw (${pokemon.battleAffliction.helpTurns||0}/3)`:pokemon.battleAffliction.assisted?"Assist ready (+5)":"Assist next save (+5)"})]})]}),
        e.jsx("div",{className:"battle-mode-stats",children:["atk","def","satk","sdef","spd"].map(key=>e.jsxs("span",{children:[key.toUpperCase()," ",e.jsx("strong",{children:pokemonStats[key]||0})]},key))}),
        e.jsxs("div",{className:"battle-mode-moves",children:[e.jsx("h4",{children:"Moves"}),!(pokemon.moves||[]).length&&e.jsx("div",{className:"text-muted",children:"This Pokemon has no assigned moves."}),(pokemon.moves||[]).map((move,index)=>{const resolved=resolveMove(move),matchup=opponent?effectivenessAgainst(resolved.type||"Normal",opponent):null;return e.jsxs("button",{type:"button",disabled:!opponent||isFainted||hp(opponent).current<=0,onClick:()=>attack(pokemon,trainer.id,opponent,opponentTrainerId,resolved),style:{borderLeft:`4px solid ${typeColor(resolved.type||"Normal")}`},children:[e.jsxs("span",{children:[e.jsx("strong",{children:resolved.name}),e.jsxs("small",{children:[resolved.type||"Normal"," | ",resolved.category||"Physical"]}),matchup&&matchup.label!=="Neutral"&&e.jsx("small",{className:`battle-mode-effect ${matchup.immune?"immune":matchup.diceDelta>0?"strong":"weak"}`,children:matchup.immune?"Immune":`${matchup.label} (${matchup.diceDelta>0?"+":""}${matchup.diceDelta} ${Math.abs(matchup.diceDelta)===1?"die":"dice"})`})]}),e.jsx("span",{children:resolved.damage||"Status"})]},`${resolved.name}-${index}`)})]})
      ]})
    ]});
  };

  const leftSpeed=Number(combatStats(leftPokemon).spd||0),rightSpeed=Number(combatStats(rightPokemon).spd||0);
  return e.jsxs("div",{children:[
    e.jsx("h2",{className:"tab-title",children:"Battle Mode"}),
    e.jsx("p",{className:"text-muted",children:"Choose a trainer and Pokemon for each side. Selecting a move rolls accuracy and damage, then applies damage to the opposing Pokemon."}),
    leftPokemon&&rightPokemon&&e.jsx("div",{className:"battle-mode-initiative",children:leftSpeed===rightSpeed?`Speed tie: ${leftSpeed}`:`${leftSpeed>rightSpeed?displayName(leftPokemon):displayName(rightPokemon)} acts first (SPD ${Math.max(leftSpeed,rightSpeed)})`}),
    e.jsxs("div",{className:"battle-mode-grid",children:[
      e.jsx(Fighter,{side:"Fighter 1",trainer:leftTrainer,trainerId:leftTrainerId,setTrainerId:setLeftTrainerId,pokemon:leftPokemon,pokemonId:leftPokemonId,setPokemonId:setLeftPokemonId,opponent:rightPokemon,opponentTrainerId:rightTrainerId}),
      e.jsx(Fighter,{side:"Fighter 2",trainer:rightTrainer,trainerId:rightTrainerId,setTrainerId:setRightTrainerId,pokemon:rightPokemon,pokemonId:rightPokemonId,setPokemonId:setRightPokemonId,opponent:leftPokemon,opponentTrainerId:leftTrainerId})
    ]}),
    e.jsxs("section",{className:"section-card battle-mode-log",children:[e.jsxs("div",{className:"battle-mode-log-title",children:[e.jsx("h3",{children:"Battle Log"}),log.length>0&&e.jsx("button",{type:"button",className:"btn btn-secondary",onClick:()=>setLog([]),children:"Clear"})]}),log.length===0?e.jsx("div",{className:"text-muted",children:"No attacks yet."}):log.map(entry=>entry.kind==="status"?e.jsxs("div",{className:"battle-mode-log-entry status",children:[e.jsx("strong",{children:entry.pokemon}),e.jsx("div",{children:entry.note})]},entry.id):e.jsxs("div",{className:`battle-mode-log-entry ${entry.hit?"hit":"miss"}`,children:[e.jsxs("strong",{children:[entry.attacker," used ",entry.move," on ",entry.target]}),e.jsxs("div",{children:["Accuracy: d20 (",entry.d20,") + ",entry.statModifier," ",entry.attackKey,entry.accuracy!==entry.d20+entry.statModifier?` + ${entry.accuracy-entry.d20-entry.statModifier} bonus`:""," = ",entry.accuracy," vs ",entry.defenseKey," ",entry.defense," - ",entry.hit?"HIT":"MISS",entry.critical?" (CRITICAL)":"",entry.immune?" - IMMUNE":""]}),entry.hit&&entry.immune&&e.jsxs("div",{className:"battle-mode-effectiveness immune",children:[entry.effectiveness,": no damage or effects."]}),entry.hit&&!entry.immune&&entry.isStatus&&e.jsx("div",{children:entry.effect||"Status effect applies."}),entry.hit&&!entry.immune&&!entry.isStatus&&e.jsxs("div",{children:[e.jsxs("span",{className:`battle-mode-effectiveness ${entry.diceDelta>0?"strong":entry.diceDelta<0?"weak":"neutral"}`,children:[entry.effectiveness,entry.diceDelta!==0?` (${entry.diceDelta>0?"+":""}${entry.diceDelta} ${Math.abs(entry.diceDelta)===1?"die":"dice"})`:""]})," | Damage: ",entry.adjustedDice,"d",entry.dieSides," [",entry.rolls.join(", "),"] + ",entry.statModifier," stat",entry.damage-entry.rolls.reduce((sum,value)=>sum+value,0)-entry.statModifier?` + ${entry.damage-entry.rolls.reduce((sum,value)=>sum+value,0)-entry.statModifier} bonuses`:""," = ",e.jsx("strong",{children:entry.damage})]})]},entry.id))]}),
  ]});
}

export{BattleMode as default};
