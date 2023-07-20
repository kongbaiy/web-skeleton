(function() {
	var REG_EXP_PX = /\s+|px/gi;
	var SCREEN_WIDTH = window.screen.width;
	var SCREEN_HEIGHT = window.screen.height;

	var reactComponentTemplate = `import React from 'react';
	const Skeleton = (props) => {
	const { visible } = props;
	return (
		<div hidden={visible}>
			<style>
				@keyframes <@keyframesName> {'{0% {opacity: 1}50%{opacity: .5}100% {opacity: 1}}'}
				.<@className> {'{animation: <@keyframesName> 1s linear infinite;}'}
			</style>
			<@content>
		</div>
	)
	}
	export default Skeleton`;

	var vueComponentTemplate = `<template>
	<div :hidden="visible"><@content></div>
	</template>
	<script>
	export default {
	props: {
		visible: {
			type: Boolean,
			default: false
		}
	}
	}
	</script>
	<style scoped>
	@keyframes <@keyframesName> {0% {opacity: 1}50%{opacity: .5}100% {opacity: 1}}
	.<@className> {animation: <@keyframesName> 1s linear infinite;}
	</style>
	`;

	function getElementTop(parent, sub) {
		var parentClient = parent.getBoundingClientRect();
		var subClient = sub.getBoundingClientRect();

		return parseFloat(subClient.top - parentClient.top)
	}

	function getElementLocation() {}
	getElementLocation.prototype.relative = function (parent, sub) {
		var baseWidth = parent.offsetWidth;
		var baseHeight = parent.offsetHeight;
		var top = getElementTop(parent, sub);
		var {
			left,
			width,
			height
		} = sub.getBoundingClientRect();
		var paddingTop = parseFloat(getStyle(sub, 'paddingTop').replace(REG_EXP_PX, ''));
		var paddingBottom = parseFloat(getStyle(sub, 'paddingBottom').replace(REG_EXP_PX, ''));
		var topOffset = top / baseHeight * 100 + paddingTop / baseHeight * 100;
		var leftOffset = left / baseWidth * 100;
		var offsetElementWidth = width / baseWidth * 100;
		var offsetElementHeight = Math.abs((height / baseHeight * 100) - (paddingTop + paddingBottom) /
			baseHeight * 100);

		return {
			topOffset,
			leftOffset,
			offsetElementWidth,
			offsetElementHeight
		}
	}

	function isInViewport(element) {
		var elementRect = element.getBoundingClientRect();
		
		if (
			elementRect.left >= window.screen.width || 
			elementRect.top >= window.screen.height
		) return false;
		return true
	}

	function getStyle(element, attrName) {
		var value = window.getComputedStyle ?
			window.getComputedStyle(element)[attrName] :
			element.currentStyle[attrName];

		return value
	}

	function isVisible(element) {
		if (
			getStyle(element, 'display') === 'none' ||
			getStyle(element, 'visibility') === 'hidden' ||
			getStyle(element, 'opacity') == 0 ||
			element.hidden
		) return false;
		return true;
	}

	function randomId() {
		var abc = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'g', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u',
			'v', 'w', 'x', 'y', 'z'
		];
		var [max, min] = [Math.floor(Math.random() * (10 - 7 + 1) + 1), Math.floor(Math.random() * (17 - 10 + 1) + 17)];
		abc = abc.sort(() => 0.4 - Math.random()).slice(max, min).slice(0, 8).join("");
		var a = new Date().getTime() + abc;
		return a
	}

	function resetHsitroy() {
		function bindHistoryEvent(type) {
			var historyEvent = window.history[type];
			return function () {
				var newEvent = historyEvent.apply(this, arguments);
				var e = new Event(type);
				e.arguments = arguments;
				window.dispatchEvent(e);
				return newEvent;
			}
		}
		window.history.pushState = bindHistoryEvent('pushState');
		window.history.replaceState = bindHistoryEvent('replaceState');
	}

	function EventListener(events, callback) {
		var eventArr = events.split(',');
		eventArr.forEach((eventname) => {
			window.addEventListener(eventname.trim(), callback);
		});
	}

	function Route() {
		if (this.constructor !== Route) {
			throw new Error('Route is not new Function');
			return;
		}
		resetHsitroy();
		this.executeStatus = false;
		this.listenerCallback = null;

		EventListener('hashchange, replaceState, pushState, popstate', function (e) {
			if (!this.executeStatus) {
				this.executeStatus = true;
				this.listenerCallback(e);
			} else {
				this.executeStatus = false;
			}
		}.bind(this));
	}

	Route.prototype.listener = function (callback) {
		if (typeof callback === 'function') {
			return this.listenerCallback = callback;
		}
	}

	function Skeleton(config) {
		if (this.constructor !== Skeleton) {
			throw new Error('Skeleton is not new Function');
			return;
		}

		this.currentRoot = null;
		this.currentRootChildCount = 0;
		this.currentRootChildNum = 0;
		this.className = null;
		this.keyframesName = null;
		this.elementLocation = new getElementLocation();
		var route = new Route();

		window.addEventListener('load', function () {
			route.listener(this.init.call(this, config));
		}.bind(this));
	}

	Skeleton.prototype.getCurrentConfig = function (config) {
		var currentConfig = config.map(function (item) {
			if (item.path === window.location.pathname) return item;
		});
		return currentConfig
	}

	Skeleton.prototype.init = function (config) {
		this.getCurrentConfig(config).forEach(function(item) {
			var root =  typeof item.root === 'function' ? item.root() : item.root;
			
			if (root instanceof Element) {
				var allElement = root.getElementsByTagName('*').length;
				var allScript = root.getElementsByTagName('script').length;
				var allNoScript = root.getElementsByTagName('noscript').length;
	
				this.currentRoot = root;
				this.currentRootChildCount = allElement - (allScript + allNoScript);
				this.className = 's_' + randomId();
				this.keyframesName = 's_' + randomId();
				
				this.create(root, item.mode, item.filename);
			} else {
				throw new Error(`${JSON.stringify(root)} is not Element`);
			}
		}.bind(this));
	}

	Skeleton.prototype.create = function (root, mode, filename) {
		for (let i = 0; i < root?.children?.length; i++) {
			var node = root.children[i];

			if (node.localName !== 'script' && node.localName !== 'noscript') {
				var viewport = isInViewport(node);
				var visible = isVisible(node);

				this.currentRootChildNum += 1;
				if (
					viewport &&
					visible &&
					!node.children.length &&
					getStyle(node, 'width').length &&
					getStyle(node, 'height').length
				) {
					this.setMode({
						type: mode,
						parent: this.currentRoot,
						sub: node,
						filename
					});
				}
                
				node.children.length > 0 && this.create(node, mode, filename);
			}
		}
	}

	Skeleton.prototype.setMode = function (options = {}) {
		var _this = this;
		switch (options.type) {
			case 'react':
				_this.setReactStyle(options.parent, options.sub, function (htmlString) {
					_this.downloadReactVueComponent('react', htmlString, options.filename);
				});
				break;
			case 'vue':
				_this.setVueStyle(options.parent, options.sub, function (htmlString) {
					_this.downloadReactVueComponent('vue', htmlString, options.filename);
				});
				break;

			case 'img':
				_this.setImgStyle(options.parent, options.sub, function (htmlString) {
					_this.downloadImg({
						parent: options.parent,
						base64Content: htmlString,
						filename: options.filename
					});
				});
				break;
		}
	}

	Skeleton.prototype.setReactStyle = function (parent, sub, completedCallback) {
		var {
			topOffset,
			leftOffset,
			offsetElementWidth,
			offsetElementHeight
		} = this.elementLocation.relative(parent, sub);
		var style = `
			position: 'absolute',
			top: '${topOffset}%',
			left: '${leftOffset}%',
			boxSizing: 'border-box',
			width: '${offsetElementWidth}%',
			height: '${offsetElementHeight}%',
			backgroundColor: '#ecf0f2',
		`;
		var borderRadius = getStyle(sub, 'borderRadius');

		if (parseFloat(borderRadius.replace(/\D/g, '')) > 0)
			style += `borderRadius: '${borderRadius}'`;

		if (!this.reactHtmlString) this.reactHtmlString = '';
		this.reactHtmlString += `<div className='${this.className}' style={{${style}}}></div>`;

		if (
			typeof completedCallback === 'function' &&
			this.currentRootChildNum === this.currentRootChildCount
		) {
			var width = parent.offsetWidth / SCREEN_WIDTH * 100;
			var height = parent.offsetHeight / SCREEN_HEIGHT * 100;
			var containerStyle = `
				overflow: 'hidden',
				position: 'relative',
				width: '${width}vw',
				height: '${height}vh'
			`;
			var content = `<div style={{${containerStyle}}}>${this.reactHtmlString}</div>`;
			var reactComponentString = reactComponentTemplate
				.replaceAll('<@className>', this.className)
				.replaceAll('<@keyframesName>', this.keyframesName)
				.replaceAll('<@content>', content);

			completedCallback(reactComponentString);
			delete this.reactHtmlString;
			this.currentRootChildNum = 0;
			this.currentRootChildCount = 0;
		}
	}

	Skeleton.prototype.downloadReactVueComponent = function (type, content, filename) {
		if (!filename) filename = window.location.pathname.replace('.html', '');

		var oA = document.createElement('a');
		var fileType = {
			'react': 'jsx',
			'vue': 'vue'
		};

		oA.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
		oA.setAttribute('download', `${filename}.${fileType[type]}`);
		oA.style.display = 'none';
		document.body.appendChild(oA);
		oA.click();
		oA.remove();
	}

	Skeleton.prototype.setVueStyle = function (parent, sub, completedCallback) {
		var {
			topOffset,
			leftOffset,
			offsetElementWidth,
			offsetElementHeight
		} = this.elementLocation.relative(parent, sub);
		var style = `
			position: 'absolute',
			top: '${topOffset}%',
			left: '${leftOffset}%',
			boxSizing: 'border-box',
			width: '${offsetElementWidth}%',
			height: '${offsetElementHeight}%',
			backgroundColor: '#ecf0f2',
		`;
		var borderRadius = getStyle(sub, 'borderRadius');

		if (parseFloat(borderRadius.replace(/\D/g, '')) > 0)
			style += `borderRadius: '${borderRadius}'`;

		if (!this.vueHtmlString) this.vueHtmlString = '';
		this.vueHtmlString += `<div class='${this.className}' :style="{${style}}"></div>`;

		if (
			typeof completedCallback === 'function' &&
			this.currentRootChildNum === this.currentRootChildCount
		) {
			var width = parent.offsetWidth / SCREEN_WIDTH * 100;
			var height = parent.offsetHeight / SCREEN_HEIGHT * 100;
			var containerStyle = `
				overflow: 'hidden',
				position: 'relative',
				width: '${width}vw',
				height: '${height}vh'
			`.replace(/[\r\n]/g, '').trim().replace(/\t/g, '');
			var content = `<div :style="{${containerStyle}}">${this.vueHtmlString.replace(/[\r\n]/g, '').trim().replace(/\t/g, '')}</div>`;
			var vueComponentString = vueComponentTemplate
				.replaceAll('<@className>', this.className)
				.replaceAll('<@keyframesName>', this.keyframesName)
				.replaceAll('<@content>', content);

			completedCallback(vueComponentString);
			delete this.vueHtmlString;
			this.currentRootChildNum = 0;
			this.currentRootChildCount = 0;
		}
	}

	Skeleton.prototype.setImgStyle = function (parent, sub, completedCallback) {
		var {
			topOffset,
			leftOffset,
			offsetElementWidth,
			offsetElementHeight
		} = this.elementLocation.relative(parent, sub);
		var style = `
			position: absolute;
			top: ${topOffset}%;
			left: ${leftOffset}%;
			box-sizing: border-box;
			width: ${offsetElementWidth}vw;
			height: ${offsetElementHeight}vh;
			background-color: #ecf0f2;
		`;
		var borderRadius = getStyle(sub, 'borderRadius');

		if (parseFloat(borderRadius.replace(/\D/g, '')) > 0)
			style += `borderRadius: '${borderRadius}'`;

		if (!this.imgHtmlString) this.imgHtmlString = '';
		this.imgHtmlString += `<div class='${this.className}' style='${style}'></div>`;

		if (
			typeof completedCallback === 'function' &&
			this.currentRootChildNum === this.currentRootChildCount
		) {
			var width = parent.offsetWidth / SCREEN_WIDTH * 100;
			var height = parent.offsetHeight / SCREEN_HEIGHT * 100;
			var containerStyle = `
				overflow: hidden;
				position: relative;
				width: ${width}vw;
				height: ${height}vh;
			`;
			var content = `<div style='${containerStyle}'>${this.imgHtmlString}</div>`;
			var svgString = `<svg xmlns='http://www.w3.org/2000/svg' width='${SCREEN_WIDTH}' height='${SCREEN_HEIGHT}'>
				<foreignObject width="100%" height="100%">
					<div xmlns="http://www.w3.org/1999/xhtml">${content}</div>
				</foreignObject>
			</svg>`;

			completedCallback(svgString);
			delete this.imgHtmlString;
			this.currentRootChildNum = 0;
			this.currentRootChildCount = 0;
		}
	}

	Skeleton.prototype.drawImg = function (parent, base64Content, callback) {
		var canvas = document.createElement('canvas');
		var ctx = canvas.getContext("2d");

		canvas.width = parent.offsetWidth;
		canvas.height = parent.offsetHeight;

		var base64 = 'data:image/svg+xml,' + encodeURIComponent(base64Content);
		var img = document.createElement('img');

		img.setAttribute('src', base64);
		img.addEventListener('load', (e) => {
			ctx.drawImage(e.target, 0, 0);
			typeof callback === 'function' && callback(canvas.toDataURL());
		});
	}

	/**
	 * @param {Element} parent
	 * @param {String} base64Content
	 * @param {String} filename
	 * @param {String} format
	 * */
	Skeleton.prototype.downloadImg = function (options = {}) {
		if (!options.filename) options.filename = window.location.pathname.replace('.html', '');
		if (!options.format) options.format = 'png';

		this.drawImg(options.parent, options.base64Content, function (url) {
			if (!url) return;
			var oA = document.createElement('a');

			oA.download = `${options.filename}.${options.format}`;
			oA.href = url;
			document.body.appendChild(oA);
			oA.click();
			oA.remove();
		});
	}

	window.Skeleton = Skeleton;
})();