/**
 * Type-checks the TypeScript code blocks in the README against the sources.
 *
 * Each block becomes its own module. Library exports a block uses without importing them
 * (the README shows each import once per section) are imported automatically, and the
 * placeholders below stand in for the application code the examples refer to.
 */
/* eslint-disable unicorn/prefer-iterator-to-array -- the ES2024 lib has no types for iterator helpers */
import {spawnSync} from 'node:child_process';
import {
	mkdirSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = path.resolve(import.meta.dirname, '..');
const outDir = path.join(root, 'node_modules/.cache/readme-snippets');

const responsiveState = 'import(\'@mrcgrtz/redux-responsive\').ResponsiveState';

// Names the README uses without defining them
const placeholders: Array<[name: string, declaration: string]> = [
	['store', 'declare const store: import(\'redux\').Store<RootState>;'],
	['middleware', 'declare const middleware: import(\'redux\').Middleware[];'],
	['iframe', 'declare const iframe: HTMLIFrameElement;'],
	['App', 'declare function App(): null;'],
	['props', 'declare const props: {active: boolean};'],
	['styles', 'declare const styles: {element: object; elementThin: object};'],
	['browser', `declare const browser: ${responsiveState};`],
	['stylesheet', 'const stylesheet = {element: {color: \'blue\', _lessThan_medium: {color: \'black\'}}};'],
];

const modules: Record<string, string[]> = {
	'@mrcgrtz/redux-responsive': Object.keys(await import('../src/index.ts')),
	'@mrcgrtz/redux-responsive/react': Object.keys(await import('../src/react/index.ts')),
	'react-redux': ['Provider', 'useSelector'],
};

const isUsed = (code: string, name: string) => new RegExp(String.raw`\b${name}\b`, 'v').test(code);

function toModule(code: string): string {
	const imported = new Set(
		[...code.matchAll(/import \{(?<names>[^\}]*)\}/gv)]
			.flatMap(match => match.groups!.names.split(','))
			.map(name => name.replace(/^\s*type\s+/v, '').split(' as ').at(-1)!.trim()),
	);
	const defined = new Set(
		[...code.matchAll(/\b(?:const|function|type)\s+(?:\{\s*)?(?<name>\w+)/gv)].map(match => match.groups!.name),
	);
	const isAvailable = (name: string) => imported.has(name) || defined.has(name);

	const lines = [`type RootState = {browser: ${responsiveState}; screen: ${responsiveState}};`];
	for (const [specifier, names] of Object.entries(modules)) {
		const missing = names.filter(name => isUsed(code, name) && !isAvailable(name));
		if (missing.length > 0) {
			lines.push(`import {${missing.join(', ')}} from '${specifier}';`);
		}
	}

	for (const [name, declaration] of placeholders) {
		if (isUsed(code, name) && !isAvailable(name)) {
			lines.push(declaration);
		}
	}

	// A block consisting of a single JSX expression
	const body = code.trimStart().startsWith('<') ? `export const snippet = (\n${code.trim()}\n);` : code;
	return `${lines.join('\n')}\n${body}\nexport {};\n`;
}

const readme = readFileSync(path.join(root, 'README.md'), 'utf8');
// The groups are read through `block.groups` below
// eslint-disable-next-line regexp/no-unused-capturing-group
const blocks = [...readme.matchAll(/```(?<language>tsx?)\n(?<code>.*?)```/gsv)];

rmSync(outDir, {recursive: true, force: true});
mkdirSync(outDir, {recursive: true});

for (const [index, block] of blocks.entries()) {
	const {language, code} = block.groups!;
	const line = readme.slice(0, block.index).split('\n').length;
	writeFileSync(
		path.join(outDir, `readme-line-${String(line).padStart(4, '0')}-${index}.${language}`),
		toModule(code),
	);
}

writeFileSync(
	path.join(outDir, 'tsconfig.json'),
	JSON.stringify({
		extends: path.join(root, 'tsconfig.json'),
		compilerOptions: {
			paths: {
				'@mrcgrtz/redux-responsive': [path.join(root, 'src/index.ts')],
				'@mrcgrtz/redux-responsive/react': [path.join(root, 'src/react/index.ts')],
			},
		},
		include: ['*.ts', '*.tsx'],
	}),
);

const {status} = spawnSync(path.join(root, 'node_modules/.bin/tsc'), ['-p', outDir], {stdio: 'inherit'});

if (status === 0) {
	console.log(`All ${blocks.length} README code blocks compile.`);
} else {
	console.error('README code blocks do not compile; file names point to the line in README.md.');
	process.exitCode = 1;
}
