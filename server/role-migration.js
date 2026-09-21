import { ROLE_RANK, accessName } from "../shared/access.js";
import { SITES } from "./sites.js";

export function migrateFiveRoles(db) {
  if (db.prepare("SELECT 1 FROM operation_migrations WHERE version=3").get()) return;
  db.exec("BEGIN");
  try {
    // Retain existing records/files. Collapse the old intermediate tiers into Engineer.
    for (const [table,column] of [["resources","required_level"],["knowledge_records","required_level"],["people","required_level"],["people","cyber_level"],["audit_logs","required_level"]]) {
      db.exec(`UPDATE ${table} SET ${column}=CASE WHEN ${column}=1 THEN 1 WHEN ${column} BETWEEN 2 AND 4 THEN 2 WHEN ${column}=5 THEN 3 WHEN ${column}=6 THEN 4 ELSE 5 END`);
    }
    for (const [role,rank] of Object.entries(ROLE_RANK)) db.prepare("UPDATE users SET cyber_level=? WHERE role=?").run(rank,role);
    db.exec("DELETE FROM level_rules; DELETE FROM sessions;");
    for(let rank=1;rank<=5;rank++) db.prepare("INSERT INTO level_rules VALUES (?,?)").run(rank,`${accessName(rank)}: this role and lower access groups`);
    for(const [name,type] of [["location_mode","TEXT NOT NULL DEFAULT 'unknown'"],["outdoor_zone","TEXT"],["latitude","REAL"],["longitude","REAL"],["location_updated_at","TEXT"]]) {
      if(!db.prepare("PRAGMA table_info(people)").all().some(c=>c.name===name)) db.exec(`ALTER TABLE people ADD COLUMN ${name} ${type}`);
    }
    db.exec("UPDATE people SET location_mode='indoor' WHERE building<>'' AND floor IS NOT NULL");
    // Illustrative map pins only; these are not verified facility coordinates or telemetry.
    const centers=[[1.451,103.818],[1.312,103.677],[1.301,103.664],[1.31,103.650],[1.269,103.616]];
    const people=db.prepare("SELECT id,site FROM people WHERE id LIKE 'DEMO-PER-%' ORDER BY id").all();
    people.forEach((person,i)=>{
      if(i%4!==0) return;
      const site=Math.max(0,SITES.findIndex(s=>s.name===person.site));
      const [lat,lng]=centers[site];
      db.prepare("UPDATE people SET location_mode='outdoor',building='',floor=NULL,room='',outdoor_zone=?,latitude=?,longitude=?,location_updated_at=?,location_note=? WHERE id=?").run(
        ["Quayside inspection area","Vessel service area","Open fabrication area"][i%3],lat+(i%3)*.0003,lng+(i%2)*.0004,new Date().toISOString(),
        "Simulated outdoor position. Illustrative pin only; not a verified facility location or live worker tracking.",person.id);
    });
    db.prepare("INSERT INTO operation_migrations VALUES (3)").run();
    db.exec("COMMIT");
  } catch(e) { db.exec("ROLLBACK"); throw e; }
}
