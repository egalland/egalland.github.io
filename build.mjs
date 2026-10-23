import {stripTypeScriptTypes} from 'node:module';
import {readFileSync,writeFileSync} from 'node:fs';
for(const name of ['model','app'])writeFileSync(`dist/${name}.js`,stripTypeScriptTypes(readFileSync(`src/${name}.ts`,'utf8')));
