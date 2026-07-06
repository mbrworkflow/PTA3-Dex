import{j as e,r as React}from"./vendor-react-CTJUxz_o.js";
import{u as useTrainerContext,d as usePokemonContext,f as useGameData,h as typeColor,k as pokemonImage,E as parseDice,N as critThreshold,l as stabBonus,t as toast}from"./app-core-passives15.js";

const selectStyle={width:"100%",padding:"9px 10px",borderRadius:"6px",border:"1px solid var(--border-medium)",background:"var(--input-bg)",color:"var(--text-primary)",font:"inherit"};
const rollDie=sides=>Math.floor(Math.random()*sides)+1;
const displayName=pokemon=>pokemon?.name||pokemon?.species||"Pokemon";

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
  const updateDamage=(trainerId,pokemonId,amount)=>{
    setTrainers(current=>current.map(trainer=>{
      if(String(trainer.id)!==String(trainerId))return trainer;
      const update=list=>(list||[]).map(pokemon=>String(pokemon.id)===String(pokemonId)?{...pokemon,currentDamage:Math.max(0,(pokemon.currentDamage||0)+amount)}:pokemon);
      return{...trainer,party:update(trainer.party),reserve:update(trainer.reserve)};
    }));
  };
  const restore=(trainerId,pokemonId)=>{
    setTrainers(current=>current.map(trainer=>String(trainer.id)!==String(trainerId)?trainer:{...trainer,party:(trainer.party||[]).map(pokemon=>String(pokemon.id)===String(pokemonId)?{...pokemon,currentDamage:0}:pokemon),reserve:(trainer.reserve||[]).map(pokemon=>String(pokemon.id)===String(pokemonId)?{...pokemon,currentDamage:0}:pokemon)}));
  };

  const attack=(attacker,attackerTrainerId,target,targetTrainerId,moveInput)=>{
    if(!attacker||!target)return;
    if(hp(attacker).current<=0){toast.warning(`${displayName(attacker)} has fainted.`);return}
    if(hp(target).current<=0){toast.warning(`${displayName(target)} has already fainted.`);return}
    const move=resolveMove(moveInput),category=move.category||"Physical",isPhysical=category==="Physical",isStatus=category==="Status";
    const attackKey=isPhysical?"atk":isStatus?"spd":"satk";
    const defenseKey=isPhysical?"def":isStatus?"spd":"sdef";
    const accuracyKey=isPhysical?"atk":isStatus?"eff":"satk";
    const attackerStats=stats(attacker),targetStats=stats(target);
    const attackStat=Number(attackerStats[attackKey]||0),defense=Number(targetStats[defenseKey]||0);
    const statModifier=Math.floor(attackStat/2),accuracyModifier=Number(attacker.accuracyMods?.[accuracyKey]||0);
    const d20=rollDie(20),accuracy=d20+statModifier+accuracyModifier;
    const threshold=critThreshold(move.effect||move.description||""),critical=d20>=threshold;
    const hit=critical||accuracy>=defense;
    const formula=parseDice(move.damage||"");
    let rolls=[],damage=0,stab=0;
    if(hit&&!isStatus&&formula.count>0){
      rolls=critical?Array(formula.count).fill(formula.sides):Array.from({length:formula.count},()=>rollDie(formula.sides));
      stab=attacker.types?.includes(move.type)?stabBonus():0;
      damage=rolls.reduce((sum,value)=>sum+value,0)+(formula.bonus||0)+statModifier+stab;
      updateDamage(targetTrainerId,target.id,damage);
    }
    const entry={id:Date.now()+Math.random(),attacker:displayName(attacker),target:displayName(target),move:move.name,type:move.type||"Normal",category,d20,accuracy,attackKey:attackKey.toUpperCase(),statModifier,defenseKey:defenseKey.toUpperCase(),defense,hit,critical,isStatus,rolls,formula:move.damage||"-",damage,effect:move.effect||move.description||""};
    setLog(current=>[entry,...current].slice(0,30));
  };

  const Fighter=({side,trainer,trainerId,setTrainerId,pokemon,pokemonId,setPokemonId,opponent,opponentTrainerId})=>{
    const pokemonList=pokemonFor(trainer),health=hp(pokemon),pokemonStats=stats(pokemon),isFainted=pokemon&&health.current<=0;
    return e.jsxs("section",{className:"battle-mode-fighter",children:[
      e.jsx("div",{className:"battle-mode-side-label",children:side}),
      e.jsx("label",{children:[e.jsx("span",{children:"Trainer"}),e.jsx("select",{value:trainerId,onChange:event=>{setTrainerId(event.target.value);setPokemonId("")},style:selectStyle,children:trainers.filter(item=>!item.archived).map(item=>e.jsx("option",{value:String(item.id),children:item.name||"Unnamed Trainer"},item.id))})]}),
      e.jsx("label",{children:[e.jsx("span",{children:"Pokemon"}),e.jsxs("select",{value:pokemonId,onChange:event=>setPokemonId(event.target.value),style:selectStyle,children:[pokemonList.length===0&&e.jsx("option",{value:"",children:"No Pokemon available"}),pokemonList.map(item=>e.jsx("option",{value:String(item.id),children:`${displayName(item)}${(trainer.party||[]).some(p=>p.id===item.id)?" - Party":" - Reserve"}`},item.id))]})]}),
      pokemon&&e.jsxs(React.Fragment,{children:[
        e.jsxs("div",{className:"battle-mode-pokemon-head",children:[pokemonImage(pokemon)&&e.jsx("img",{src:pokemonImage(pokemon),alt:displayName(pokemon)}),e.jsxs("div",{children:[e.jsx("strong",{children:displayName(pokemon)}),e.jsx("div",{className:"text-muted",children:(pokemon.types||[]).join(" / ")})]}),e.jsx("button",{type:"button",className:"btn btn-secondary",onClick:()=>restore(trainer.id,pokemon.id),children:"Restore HP"})]}),
        e.jsxs("div",{className:"battle-mode-hp",children:[e.jsxs("div",{children:[e.jsx("strong",{children:`${health.current}/${health.max} HP`}),isFainted&&e.jsx("span",{children:"Fainted"})]}),e.jsx("div",{children:e.jsx("span",{style:{width:`${health.max?health.current/health.max*100:0}%`,background:health.current/health.max>.5?"#4caf50":health.current/health.max>.2?"#ff9800":"#e53935"}})})]}),
        e.jsx("div",{className:"battle-mode-stats",children:["atk","def","satk","sdef","spd"].map(key=>e.jsxs("span",{children:[key.toUpperCase()," ",e.jsx("strong",{children:pokemonStats[key]||0})]},key))}),
        e.jsxs("div",{className:"battle-mode-moves",children:[e.jsx("h4",{children:"Moves"}),!(pokemon.moves||[]).length&&e.jsx("div",{className:"text-muted",children:"This Pokemon has no assigned moves."}),(pokemon.moves||[]).map((move,index)=>{const resolved=resolveMove(move);return e.jsxs("button",{type:"button",disabled:!opponent||isFainted||hp(opponent).current<=0,onClick:()=>attack(pokemon,trainer.id,opponent,opponentTrainerId,resolved),style:{borderLeft:`4px solid ${typeColor(resolved.type||"Normal")}`},children:[e.jsxs("span",{children:[e.jsx("strong",{children:resolved.name}),e.jsxs("small",{children:[resolved.type||"Normal"," | ",resolved.category||"Physical"]})]}),e.jsx("span",{children:resolved.damage||"Status"})]},`${resolved.name}-${index}`)})]})
      ]})
    ]});
  };

  const leftSpeed=Number(stats(leftPokemon).spd||0),rightSpeed=Number(stats(rightPokemon).spd||0);
  return e.jsxs("div",{children:[
    e.jsx("h2",{className:"tab-title",children:"Battle Mode"}),
    e.jsx("p",{className:"text-muted",children:"Choose a trainer and Pokemon for each side. Selecting a move rolls accuracy and damage, then applies damage to the opposing Pokemon."}),
    leftPokemon&&rightPokemon&&e.jsx("div",{className:"battle-mode-initiative",children:leftSpeed===rightSpeed?`Speed tie: ${leftSpeed}`:`${leftSpeed>rightSpeed?displayName(leftPokemon):displayName(rightPokemon)} acts first (SPD ${Math.max(leftSpeed,rightSpeed)})`}),
    e.jsxs("div",{className:"battle-mode-grid",children:[
      e.jsx(Fighter,{side:"Fighter 1",trainer:leftTrainer,trainerId:leftTrainerId,setTrainerId:setLeftTrainerId,pokemon:leftPokemon,pokemonId:leftPokemonId,setPokemonId:setLeftPokemonId,opponent:rightPokemon,opponentTrainerId:rightTrainerId}),
      e.jsx(Fighter,{side:"Fighter 2",trainer:rightTrainer,trainerId:rightTrainerId,setTrainerId:setRightTrainerId,pokemon:rightPokemon,pokemonId:rightPokemonId,setPokemonId:setRightPokemonId,opponent:leftPokemon,opponentTrainerId:leftTrainerId})
    ]}),
    e.jsxs("section",{className:"section-card battle-mode-log",children:[e.jsxs("div",{className:"battle-mode-log-title",children:[e.jsx("h3",{children:"Battle Log"}),log.length>0&&e.jsx("button",{type:"button",className:"btn btn-secondary",onClick:()=>setLog([]),children:"Clear"})]}),log.length===0?e.jsx("div",{className:"text-muted",children:"No attacks yet."}):log.map(entry=>e.jsxs("div",{className:`battle-mode-log-entry ${entry.hit?"hit":"miss"}`,children:[e.jsxs("strong",{children:[entry.attacker," used ",entry.move," on ",entry.target]}),e.jsxs("div",{children:["Accuracy: d20 (",entry.d20,") + ",entry.statModifier," ",entry.attackKey,entry.accuracy!==entry.d20+entry.statModifier?` + ${entry.accuracy-entry.d20-entry.statModifier} bonus`:""," = ",entry.accuracy," vs ",entry.defenseKey," ",entry.defense," - ",entry.hit?"HIT":"MISS",entry.critical?" (CRITICAL)":""]}),entry.hit&&entry.isStatus&&e.jsx("div",{children:entry.effect||"Status effect applies."}),entry.hit&&!entry.isStatus&&e.jsxs("div",{children:["Damage: ",entry.formula," [",entry.rolls.join(", "),"] + ",entry.statModifier," stat",entry.damage-entry.rolls.reduce((sum,value)=>sum+value,0)-entry.statModifier?` + ${entry.damage-entry.rolls.reduce((sum,value)=>sum+value,0)-entry.statModifier} bonuses`:""," = ",e.jsx("strong",{children:entry.damage})]})]},entry.id))]}),
  ]});
}

export{BattleMode as default};
