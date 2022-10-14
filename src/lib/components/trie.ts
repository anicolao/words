export class Trie {
	children: { [key: string]: Trie } = {};
	isWord = false;

	insert(s: string) {
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		let leaf: Trie = this;
		while (s.length > 0) {
			if (leaf.hasChild(s)) {
				leaf = leaf.children[s[0]];
			} else {
				const newLeaf = new Trie();
				leaf.children[s[0]] = newLeaf;
				leaf = newLeaf;
			}
			s = s.substr(1);
		}
		leaf.isWord = true;
	}

	hasChild(s: string): boolean {
		if (s.length === 0) {
			return true;
		}
		return s[0] in this.children;
	}

	getLeaf(s: string): Trie | null {
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		let leaf: Trie = this;
		while (s.length > 0) {
			if (!leaf.hasChild(s)) {
				return null;
			}
			leaf = leaf.children[s[0]];
			s = s.substr(1);
		}
		return leaf;
	}

	contains(s: string): boolean {
		const leaf = this.getLeaf(s);
		return !!leaf && leaf.isWord;
	}

	containsPrefix(s: string): boolean {
		return !!this.getLeaf(s);
	}
}

export function generateDictionary(ospd: string[]): Trie {
	const ret = new Trie();
	for (const i in ospd) {
		const w = ospd[i];
		ret.insert(w);
	}
	return ret;
}
