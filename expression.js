/**
	Copyright (c) 2012 Grigory Ponomar

	This program is free software; you can redistribute it and/or
	modify it under the terms of the GNU General Public License
	as published by the Free Software Foundation; either version 2
	of the License, or (at your option) any later version.

	This program is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU General Public License for more details (http://www.gnu.org).
*/

Expression = function (code, scope, funcs)
{
	this.it = 0;
	this.sym = '';
	this.src = '';
	this.srclen = 0;
	this.expr = [];
	this.vars = scope || new VarScope();
	this.funcs = funcs || new FuncScope();
	this.lastError = '';
	if (code) {
		this.parse(code);
	}
}

Expression.prototype = 
{
	parse: function(code) 
	{
		try {
			this.lastError = '';
			this.src = code.toLowerCase();
			this.srclen = this.src.length;
			this.getChar();
			var i, list = this.list();
			if (! this.isEnd()) {
				throw "Unexpected symbol: '" + this.sym + "'";
			}
			for (i = 0; i < list.length; i++) {
				this.expr.push(list[i]);
			}
			return true;
		} catch (e) {
			this.lastError = "Syntax error: '" + e + "' in '" + this.src + "' after '" + this.src.substr(0, this.it - 1) + "' (char " + this.it + ')';
			return false;
		}
	},
	clear: function ()
	{
		this.reset();
		this.expr = [];
	},
	reset: function()
	{
		this.vars.reset();
	},
	setScope: function(scope)
	{
		this.vars = scope;
	},
	setFuncScope: function(scope) 
	{
		this.funcs = scope;
	},
	evaluate : function ()
	{
		var r = 0, i;
		for (i = 0; i < this.expr.length; i++) {
			r = this.evalNode(this.expr[i]);
		}
		return r;
	},
	evalNode : function (node)
	{
		var i, r;
		switch (node[0]) {
			case 'num': return node[1];
			case 'str': return node[1];
			case 'var': return this.getVar(node[1]);
			case 'func': return this.evalFunc(node[1], node[2]);
			case 'neg': return - this.evalNode(node[1]);
			case 'not': return this.evalNode(node[1]) ? 0 : 1;
			case '()': return this.evalNode(node[1]);
			case ':=': return this.setVar(node[1][1], this.evalNode(node[2]));
			case '+':
				r = this.evalNode(node[1]); 
				for (i = 2; i < node.length; i++) r += this.evalNode(node[i]);
				return r;
			case '-':
				r = this.evalNode(node[1]); 
				for (i = 2; i < node.length; i++) r -= this.evalNode(node[i]);
				return r;
			case '*':
				r = this.evalNode(node[1]); 
				for (i = 2; i < node.length; i++) r *= this.evalNode(node[i]);
				return r;
			case '/':
				r = this.evalNode(node[1]); 
				for (i = 2; i < node.length; i++) r /= this.evalNode(node[i]);
				return r;
			case 'or':
				for (i = 1; i < node.length; i++)
					if (this.evalNode(node[i])) return 1;
				return 0;
			case 'and':
				for (i = 1; i < node.length; i++)
					if (! this.evalNode(node[i])) return 0;
				return 1;
			case '=': return this.evalNode(node[1]) == this.evalNode(node[2]) ? 1 : 0;
			case '!=': return this.evalNode(node[1]) == this.evalNode(node[2]) ? 0 : 1;
			case '>': return this.evalNode(node[1]) > this.evalNode(node[2]) ? 1 : 0;
			case '<': return this.evalNode(node[1]) < this.evalNode(node[2]) ? 1 : 0;
			case '>=': return this.evalNode(node[1]) >= this.evalNode(node[2]) ? 1 : 0;
			case '<=': return this.evalNode(node[1]) <= this.evalNode(node[2]) ? 1 : 0;
		}
		throw 'Eval error: invalid operator: ' + node[0];
	},
	evalFunc: function(name, args)
	{
		var i, argv = [];
		for (i = 0; i < args.length; i++) {
			argv.push(this.evalNode(args[i]));
		}
		return this.funcs.call(name, this, argv);
	},
	getVar : function (varn)
	{
		return this.vars.get(varn);
	},
	getVars : function (varn)
	{
		return this.vars.getAll();
	},
	setVar : function (varn, val)
	{
		return this.vars.set(varn, val);
	},
	getChar : function ()
	{
		this.sym = this.isEnd() ? null : this.src.charAt(this.it++);
		return this.sym;
	},
	isEnd : function ()
	{
		return this.it > this.srclen;
	},
	isTerminator : function ()
	{
		return this.isEnd() || ';' == this.sym || ',' == this.sym;
	},
	isSpace : function (s)
	{
		return ' ' == s || "\r" == s || "\n" == s || "\t" == s;
	},
	isNum : function (s)
	{
		var c = s.charCodeAt(0);
		return c >= 48 && c <= 57;
	},
	isAlpha : function (s)
	{
		var c = s.charCodeAt(0);
		return c >= 97 && c <= 122;
	},
	isAlNum : function (s)
	{
		return this.isNum(s) || this.isAlpha(s);
	},
	expect : function (sym)
	{
		var i, l = sym.length;
		for (i = 0; i < l; i++) {
			if (this.sym != sym.charAt(i)) {
				throw "'" + sym + "' expected";
			}
			this.getChar();
		}
	},
	expectSpace : function ()
	{
		if (! this.isSpace(this.sym)) {
			throw 'space expected';
		}
		this.getChar();
	},
	skipSpaces : function ()
	{
		while (! this.isEnd() && this.isSpace(this.sym)) this.getChar();
		return ! this.isTerminator();
	},
	list : function ()
	{
		var l = [];
		while (this.skipSpaces()) {
			l.push(this.assign());
			this.skipSpaces();
			if (! this.isTerminator()) {
				break;
			}
			this.getChar();
		}
		return l;
	},
	arglist : function ()
	{
		var l = [];
		for(;;) {
			this.skipSpaces();
			if (')' == this.sym) {
				break;
			}
			if (l.length > 0) {
				this.expect(',');
				this.skipSpaces();
			}
			l.push(this.assign());
		}
		return l;
	},
	assign : function ()
	{
		if (this.skipSpaces()) {
			var l = this.logic2();
			if (this.skipSpaces()) {
				if (':' == this.sym) {
					this.expect(':=');
					if (l[0] != 'var') throw 'invalid left value'
					return [':=', l, this.logic2()];
				}
			}
			return l;
		}
		throw 'operand expected';
	},
	logic2 : function ()
	{
		if (this.skipSpaces()) {
			var l = ['or', this.logic1()];
			while (this.skipSpaces() && this.checkToken('or')) {
				l.push(this.logic1());
			}
			return l.length > 2 ? l : l[1];
		}
		throw 'operand expected';
	},
	logic1 : function ()
	{
		if (this.skipSpaces()) {
			var l = ['and', this.compare()];
			while (this.skipSpaces() && this.checkToken('and')) {
				l.push(this.compare());
			}
			return l.length > 2 ? l : l[1];
		}
		throw 'operand expected';
	},
	compare : function ()
	{
		if (this.skipSpaces()) {
			var op = '';
			var l = this.ariph2();
			if (this.skipSpaces()) {
				if ('=' == this.sym) {
					this.getChar();
					op = '=';
				} else if ('<' == this.sym) {
					this.getChar();
					if ('=' == this.sym) {
						this.getChar();
						op = '<=';
					} else {
						op = '<';
					}
				} else if ('>' == this.sym) {
					this.getChar();
					if ('=' == this.sym) {
						this.getChar();
						op = '>=';
					} else {
						op = '>';
					}
				} else if ('!' == this.sym) {
					this.getChar();
					this.expect('=');
					op = '!=';
				} else {
					return l;
				}
				return [op, l, this.ariph2()];
			}
			return l;
		}
		throw 'operand expected';
	},
	ariph2 : function (l)
	{
		if (this.skipSpaces()) {
			var op = '';
			if (! l) l = ['', this.ariph1()];
			else l = ['', l];
			while (this.skipSpaces() && ('+' == this.sym || '-' == this.sym)) {
				if ('' == op) {
					op = this.sym;
					l[0] = op;
				}
				if (op != this.sym) {
					return this.ariph2(l.length > 2 ? l : l[1]);
				}
				this.getChar();
				l.push(this.ariph1());
			}
			if ('' != op && '+' != op && '-' != op) {
				throw "'+' or '-' expected";
			}
			return l.length > 2 ? l : l[1];
		}
		throw 'operand expected';
	},
	ariph1 : function (l)
	{
		if (this.skipSpaces()) {
			var op = '';
			if (! l) l = ['', this.logic0()];
			else l = ['', l];
			while (this.skipSpaces() && ('*' == this.sym || '/' == this.sym)) {
				if ('' == op) {
					op = this.sym;
					l[0] = op;
				}
				if (op != this.sym) {
					return this.ariph1(l.length > 2 ? l : l[1]);
				}
				this.getChar();
				l.push(this.logic0());
			}
			if ('' != op && '*' != op && '/' != op) {
				throw "'*' or '/' expected";
			}
			return l.length > 2 ? l : l[1];
		}
		throw 'operand expected';
	},
	logic0 : function ()
	{
		if (this.skipSpaces()) {
			if (this.checkToken('not')) {
				return ['not', this.ariph0()];
			}
			return this.ariph0();
		}
		throw 'operand expected';
	},
	ariph0 : function ()
	{
		if (this.skipSpaces()) {
			if (this.sym == '-') {
				this.getChar();
				return ['neg', this.brackets()];
			}
			return this.brackets();
		}
		throw 'operand expected';
	},
	brackets : function ()
	{
		if (this.skipSpaces()) {
			if ('(' == this.sym) {
				this.getChar();
				var b = this.logic2();
				this.expect(')');
				return ['()', b];
			}
			return this.term();
		}
		throw 'operand expected';
	},
	term : function ()
	{
		if (this.skipSpaces()) {
			if ("'" == this.sym) {
				return ['str', this.getString()];
			}
			if (this.isNum(this.sym)) {
				return ['num', this.getNumber()];
			}
			if (this.isAlpha(this.sym)) {
				var token = this.getToken();
				if (this.skipSpaces() && '(' == this.sym) {
					this.getChar();
					var args = this.arglist();
					this.expect(')');
					return ['func', token, args];
				} else {
					return ['var', token];
				}
			}
		}
		throw 'term expected';
	},
	getNumber : function ()
	{	
		var num = this.getDigits();
		if ('.' == this.sym) {
			this.getChar();
			num += '.' + this.getDigits();
			return parseFloat(num);
		}
		return parseInt(num);
	},
	getDigits: function() 
	{
		var dig = '';
		while (! this.isTerminator() && this.isNum(this.sym)) {
			dig += this.sym;
			this.getChar();
		}
		return dig;
	},
	getString: function()
	{
		var str = '';
		this.expect("'");
		while (!this.isEnd() && "'" != this.sym) {
			if ('\\' == this.sym) {
				this.getChar();
			}
			str += this.sym;
			this.getChar();
		}
		this.expect("'");
		return str;
	},
	getToken : function ()
	{	
		var tok = '';
		if (! this.isTerminator() && this.isAlpha(this.sym)) {
			tok += this.sym;
			this.getChar();
			while (! this.isTerminator() && (this.isAlNum(this.sym) || '_' == this.sym)) {
				tok += this.sym;
				this.getChar();
			}
		}
		return tok;
	},
	checkToken : function (tok)
	{	
		var tmp = this.it;
		if (tok == this.getToken()) {
			return true;
		}
		this.it = tmp;
		this.sym = this.isEnd() ? null : this.src.charAt(this.it - 1);
		return false;
	}
};

VarScope = function(init)
{
	this.vars = init || {};
}

VarScope.prototype = 
{
	reset : function (vars)
	{
		this.vars = vars || {};
	},
	get : function (varn)
	{
		if (varn in this.vars) {
			return this.vars[varn];
		}
		return (this.vars[varn] = 0);
	},
	set : function (varn, val)
	{
		return (this.vars[varn] = val);
	},
	getAll : function ()
	{
		return this.vars;
	},
}

FuncScope = function(init)
{
	this.funcs = {};
	if (init) {
		this.register(init);
	}
}

FuncScope.prototype = 
{
	register : function (name, fn)
	{
		if (typeof name == 'object') {
			for (var k in name) {
				this.register(k, name[k]);
			}
		} else if (typeof fn == 'object') {
			for (var k in fn) {
				this.register(k, fn[k]);
			}
		} else {
			this.funcs[name] = fn;
		}
	},
	call : function (name, context, args)
	{
		if (name in this.funcs) {
			return this.funcs[name].apply(context, args);
		}
		throw 'Undefined function: ' + name;
	},
};

Expression.libs = {
	'std': {
		'int': function (x) { return parseInt(x); },
		'bool': function (x) { return x ? 1 : 0; },
		'float': function (x) { return x ? 1 : 0; },
		'if': function (c, t, f) { return c ? t : f; },
		'print': function (s) { alert(s); },
		'input': function (s) { return prompt(s); },
	},
	'math': {
		'abs': function (x) { return Math.abs(x); },
		'acos': function (x) { return Math.acos(x); },
		'asin': function (x) { return Math.asin(x); },
		'atan': function (x) { return Math.atan(x); },
		'atan2': function (x, y) { return Math.atan2(x, y); },
		'ceil': function (x) { return Math.ceil(x); },
		'cos': function (x) { return Math.cos(x); },
		'exp': function (x) { return Math.exp(x); },
		'floor': function (x) { return Math.floor(x); },
		'log': function (x) { return Math.log(x); },
		'max': function (x, y) { return Math.max(x, y); },
		'min': function (x, y) { return Math.min(x, y); },
		'pow': function (x, y) { return Math.pow(x, y); },
		'random': function (a, b) { return a + Math.random() * (b - a); },
		'round': function (x) { return Math.round(x); },
		'mod': function (x, y) { return x % y; },
		'sin': function (x) { return Math.sin(x); },
		'sqrt': function (x) { return Math.sqrt(x); },
		'tan': function (x) { return Math.tan(x); }
	},
	'array' : {
		'array_create' : function() { return []; },
		'array_push' : function(a, x) { a.push(x); return x; },
		'array_pop' : function(a) { return a.pop(); },
		'array_shift' : function(a) { return a.shift(); },
		'array_unshift' : function(a, x) { a.unshift(x); return x; },
		'array_get' : function(a, i) { return a[i]; },
		'array_set' : function(a, x, i) { return a[i] = x; },
		'array_len' : function(a) { return a.length; },
		'array_sum' : function(a) { for(var i = 0 ,sum = 0; i < a.length; sum += a[i++]); return sum; },
		'array_max' : function(a) { return Math.max.apply({},a); },
		'array_min' : function(a) { return Math.min.apply({},a); },
		'array_sort' : function(a) { return a.sort(); },
		'array_reverse' : function(a) { return a.reverse(); },
		'array_join' : function(g, a) { return a.join(g); },
	},
};
