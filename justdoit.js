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

const COPY = '<a href="http://masterfri.org.ua/justdoit/">just do it</a> by <a href="http://masterfri.org.ua/">masterfri</a>';

jdiView = function (target, options)
{
	options = options || {};
	if (typeof target == 'string') target = document.getElementById(target);
	this.options = {
		'text_next' : 'Next',
		'text_end' : 'End',
		'text_yes' : 'Yes',
		'text_no' : 'No',
		'text_reset' : 'Reset',
		'text_confirm_reset' : 'Confirm reset',
		'text_accept' : 'Ok',
		'text_skip' : 'Skip',
		'add_copy' : true,
		'vars' : {},
		'funcs' : Expression.libs
	}
	$.extend(this.options, options);
	var $T = this;
	this.target = $(target);
	this.target.children().css('display', 'none');
	this.target.addClass('jdiv-target');
	this.currentStep = null;
	this.mainThread = this.target.children().eq(0);
	this.mainThread.attr('main-thread', 'main-thread');
	this.view = $('<div class="jdiv-view"></div>');
	this.control = $('<div class="jdiv-control"></div>');
	this.mainContainer = $('<div class="jdiv-main-container"></div>');
	this.hardReset = $('<a href="#" class="jdiv-hardreser"></a>');
	this.hardReset.attr('title', this.options.text_reset);
	this.mainContainer.append(this.view);
	this.mainContainer.append(this.hardReset);
	this.mainContainer.append(this.control)
	this.target.append(this.mainContainer);
	this.timerContainer = $('<div class="jdiv-timer jdiv-hidden"></div>');
	this.userInputContainer = $('<form class="jdiv-userinput-container jdiv-hidden" action="javascript:;"></form>');
	this.userInput = $('<input class="jdiv-userinput" />');
	this.userInputContainer.append(this.userInput);
	this.control.append(this.timerContainer);
	this.control.append(this.userInputContainer);
	this.timer = null;
	this.timerValue = 0;
	this.control.append(this.createButton(this.options.text_next, 'next', 'jdiv-next', true));
	this.control.append(this.createButton(this.options.text_yes, 'yes', 'jdiv-yes', true));
	this.control.append(this.createButton(this.options.text_no, 'no', 'jdiv-no', true));
	this.control.append(this.createButton(this.options.text_reset, 'reset', 'jdiv-reset', true));
	this.control.append(this.createButton(this.options.text_accept, 'accept', 'jdiv-accept', true));
	this.control.append(this.createButton(this.options.text_skip, 'skip', 'jdiv-skip', true));
	this.vars = new VarScope(this.options.vars);
	this.funcs = new FuncScope(this.options.funcs);
	this.compileExpr();
	this.commands = {
		'next' : function() {this.nextStep();},
		'skip' : function() {this.nextStep();},
		'yes' : function() {this.replyYes();},
		'no' : function() {this.replyNo();},
		'reset' : function() {this.reset();},
		'accept' : function() {this.acceptInput();},
	};
	this.hardReset.click(function() {
		if (confirm($T.options.text_confirm_reset)) {
			$T.command('reset');
		}
	});
	this.userInputContainer.submit(function() {
		$T.command('accept');
	});
	if (this.options.add_copy) {
		$('<div class="jdiv-copy"></div>').html(COPY).insertBefore(this.target.children().first());
	}
	this.start();
}

jdiView.prototype = 
{
	getFirstStep : function ()
	{
		return this.mainThread.children().eq(0);
	},
	getNextStep : function ()
	{
		var next = this.currentStep.next();
		return next.length ? next : this.stepOut();
	},
	nextStep : function ()
	{
		if (this.timer) {
			this.stopTimer();
		}
		this.currentStep = this.getNextStep();
		this.displayStep();
	},
	replyYes : function ()
	{
		this.switchCase('yes');
	},
	replyNo : function ()
	{
		this.switchCase('no');
	},
	switchCase : function (v)
	{
		this.currentStep = this.getCase(v);
		this.displayStep();
	},
	getCase : function (v)
	{
		var variant = this.currentStep.children('[data-case=' + v + ']').children().eq(0);
		return variant.length ? variant : this.getNextStep();
	},
	stepOut : function ()
	{
		if (this.currentStep.parent().attr('main-thread')) {
			return false;
		} else {
			this.currentStep = this.currentStep.parent().parent();
			return this.getNextStep();
		}
	},
	start : function ()
	{
		this.vars.reset();
		this.currentStep = this.getFirstStep();
		this.displayStep();
	},
	finish : function() 
	{
		this.view.text(this.options.text_end);
		this.displayButton('.jdiv-reset');
	},
	reset : function ()
	{
		this.start();
	},
	displayStep : function ()
	{
		this.hideButtons();
		this.removeCases();
		if (this.currentStep) {
			switch (this.currentStep.attr('data-type')) {
				case 'simple':
					this.displaySimpleStep(this.currentStep);
					break;
				case 'yesno':
					this.displayYesnoStep(this.currentStep);
					break;
				case 'multichoise':
					this.displayMultiStep(this.currentStep);
					break;
				case 'timer':
					this.displayTimerStep(this.currentStep);
					break;
				case 'goto':
					this.gotoStep(this.currentStep.attr('data-goto'));
					break;
				case 'setvar':
					this.evalExpr(this.currentStep.get(0));
					this.nextStep();
					break;
				case 'checkvar':
					this.evalCase(this.currentStep);
					break;
				case 'userinput':
					this.displayInputStep(this.currentStep);
					break;
			}
		} else {
			this.finish();
		}
	},
	displaySimpleStep : function (step)
	{
		this.displayText(step.children('.jsb'));
		this.displayButton('.jdiv-next');
	},
	displayYesnoStep : function (step)
	{
		this.displayText(step.children('.jsb'));
		this.displayButton('.jdiv-yes,.jdiv-no');
	},
	displayMultiStep : function (step)
	{
		this.displayText(step.children('.jsb'));
		this.createCases(step);
	},
	displayTimerStep : function (step)
	{
		this.displayText(step.children('.jsb'));
		this.displayButton('.jdiv-skip');
		this.timerValue = parseInt(this.currentStep.attr('data-timer'));
		this.timerValue = isNaN(this.timerValue) ? 1 : this.timerValue;
		this.timerSetTextValue(this.timerValue);
		this.startTimer();
	},
	gotoStep : function (stepNo)
	{
		var next = this.mainThread.find('[data-step-no=' + stepNo + ']');
		this.currentStep = next.length ? next : false;
		this.displayStep();
	},
	evalCase : function (step)
	{
		var $T = this, cs = false;
		step.children('[data-case]').each(function() {
			if ($T.evalExpr(this)) {
				cs = $(this).attr('data-case');
				return false;
			}
		});
		if (cs) {
			this.switchCase(cs);
		} else {
			this.nextStep();
		}
	},
	displayInputStep : function (step)
	{
		this.displayText(step.children('.jsb'));
		this.userInputContainer.removeClass('jdiv-hidden');
		this.userInput.val('').get(0).focus()
		this.displayButton('.jdiv-accept');
	},
	startTimer : function ()
	{
		var $T = this;
		this.timer = setInterval(function() {$T.doTimer();}, 1000);
		this.timerContainer.removeClass('jdiv-hidden');
	},
	stopTimer : function ()
	{
		clearTimeout(this.timer);
		this.timerContainer.addClass('jdiv-hidden');
	},
	displayText : function (node)
	{
		var $T = this;
		node.find('[data-expr]').each(function() {
			var r = $T.evalExpr(this);
			$(this).text(r !== false ? r : '');
		});
		this.view.html(node.html());
	},
	evalExpr : function (node)
	{
		var e = $.data(node, 'expr');
		return e ? e.evaluate() : false;
	},
	createCases : function (step)
	{
		var $T = this;
		step.children('[data-case]').each(function() {
			if (! $T.evalExpr(this)) {
				var c = $('<div class="jdiv-case"></div>');
				var a = $('<a href="#"></a>').text($(this).attr('data-label'));
				var cs = $(this).attr('data-case');
				c.append(a);
				$T.control.append(c);
				a.click(function() {
					$T.switchCase(cs);
					return false;
				});
			}
		});
	},
	timerSetTextValue : function (val)
	{
		var mins = parseInt(val / 60);
		var secs = val % 60;
		if (secs < 10) {
			this.timerContainer.html(mins + ':0' + secs);
		} else {
			this.timerContainer.html(mins + ':' + secs);
		}
	},
	doTimer : function ()
	{
		this.timerValue--;
		if (this.timerValue <= 0) {
			this.nextStep();
		} else {
			this.timerSetTextValue(this.timerValue);
		}
	},
	acceptInput : function() 
	{
		var varn = this.currentStep.attr('data-varname');
		this.vars.set(varn, this.userInput.val());
		this.nextStep();
	},
	hideButtons : function ()
	{
		this.control.children().addClass('jdiv-hidden');
	},
	removeCases : function ()
	{
		this.control.children('.jdiv-case').remove();
	},
	displayButton : function (selector)
	{
		this.control.children(selector).removeClass('jdiv-hidden');
	},
	command : function (command)
	{
		if (command in this.commands) {
			this.commands[command].apply(this, []);
		}
	},
	createButton : function (label, command, css, hide)
	{
		var button = $('<div class="jdiv-button ' + css + (hide ? ' jdiv-hidden' : '') + '"><a href="javascript:;">' + label + '</a></div>');
		var $T = this;
		button.click(function() {
			$T.command(command);
			return false;
		});
		return button;
	},
	compileExpr : function ()
	{
		var $T = this;
		this.mainThread.find('[data-expr]').each(function() {
			var e = new Expression($(this).attr('data-expr'));
			$.data(this, 'expr', e);
			e.setScope($T.vars);
			e.setFuncScope($T.funcs);
		});
	},
};

// jQuery implementation
(function($){
	$.fn.justDoIt = function (options)
	{
		this.each(function () {
			new jdiView(this, options);
		});
	}
})(jQuery);
