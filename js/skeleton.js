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
		return currentConfig[0] || {}
	}

	Skeleton.prototype.init = function (config) {
		var curc = this.getCurrentConfig(config);
		var root =  typeof curc.root === 'function' ? curc.root() : curc.root;

		if (root instanceof Element) {
			var allElement = root.getElementsByTagName('*').length;
			var allScript = root.getElementsByTagName('script').length;
			var allNoScript = root.getElementsByTagName('noscript').length;
			var mode = curc.mode;
			var count = allElement - (allScript + allNoScript);

			this.currentRoot = root;
			this.className = 's_' + randomId();
			this.keyframesName = 's_' + randomId();
			this.create(root, count, mode);
		} else {
			throw new Error(`${JSON.stringify(curc)} is not Element`);
		}
	}

	Skeleton.prototype.create = function (root, count, mode) {
		for (let i = 0; i < root?.children?.length; i++) {
			var node = root.children[i];

			if (node.localName !== 'script' && node.localName !== 'noscript') {
				var viewport = isInViewport(node);
				var visible = isVisible(node);

				if (
					viewport &&
					visible &&
					!node.children.length &&
					getStyle(node, 'width').length &&
					getStyle(node, 'height').length
				) {
					this.setMode(mode, this.currentRoot, node);
				}
                
				node.children.length > 0 && this.create(node, count, mode);
			}
		}
	}

	Skeleton.prototype.setMode = function (type, parent, sub) {
		var _this = this;
		switch (type) {
			case 'react':
				_this.setReactStyle(parent, sub, function (htmlString) {
					_this.downloadReactVueComponent('react', htmlString);
				});
				break;
			case 'vue':
				_this.setVueStyle(parent, sub, function (htmlString) {
					_this.downloadReactVueComponent('vue', htmlString);
				});
				break;

			case 'img':
				_this.setImgStyle(parent, sub, function (htmlString) {
					_this.downloadImg({
						parent,
						base64Content: htmlString
					});
				});
				break;
		}
	}

	Skeleton.prototype.setReactStyle = function (parent, sub, completedCallback) {
		var _this = this;
		var {
			topOffset,
			leftOffset,
			offsetElementWidth,
			offsetElementHeight
		} = _this.elementLocation.relative(parent, sub);
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

		if (!_this.reactHtmlString) _this.reactHtmlString = '';
		_this.reactHtmlString += `<div className='${_this.className}' style={{${style}}}></div>`;

		if (typeof completedCallback === 'function' && !_this.setReactStyleTimeout) {
			clearTimeout(_this.setReactStyleTimeout);
			_this.setReactStyleTimeout = setTimeout(function () {
				var width = parent.offsetWidth / SCREEN_WIDTH * 100;
				var height = parent.offsetHeight / SCREEN_HEIGHT * 100;
				var containerStyle = `
					overflow: 'hidden',
					position: 'relative',
					width: '${width}vw',
					height: '${height}vh'
				`;
				var content = `<div style={{${containerStyle}}}>${_this.reactHtmlString}</div>`;
				var reactComponentString = reactComponentTemplate
					.replaceAll('<@className>', _this.className)
					.replaceAll('<@keyframesName>', _this.keyframesName)
					.replaceAll('<@content>', content);

				completedCallback(reactComponentString);
				delete _this.reactHtmlString;
			});
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
		var _this = this;
		var {
			topOffset,
			leftOffset,
			offsetElementWidth,
			offsetElementHeight
		} = _this.elementLocation.relative(parent, sub);
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

		if (!_this.vueHtmlString) _this.vueHtmlString = '';
		_this.vueHtmlString += `<div class='${_this.className}' :style="{${style}}"></div>`;

		if (typeof completedCallback === 'function' && !_this.setVueStyleTimeout) {
			clearTimeout(_this.setVueStyleTimeout);
			_this.setVueStyleTimeout = setTimeout(function () {
				var width = parent.offsetWidth / SCREEN_WIDTH * 100;
				var height = parent.offsetHeight / SCREEN_HEIGHT * 100;
				var containerStyle = `
					overflow: 'hidden',
					position: 'relative',
					width: '${width}vw',
					height: '${height}vh'
				`.replace(/[\r\n]/g, '').trim().replace(/\t/g, '');
				var content = `<div :style="{${containerStyle}}">${_this.vueHtmlString.replace(/[\r\n]/g, '').trim().replace(/\t/g, '')}</div>`;
				var vueComponentString = vueComponentTemplate
					.replaceAll('<@className>', _this.className)
					.replaceAll('<@keyframesName>', _this.keyframesName)
					.replaceAll('<@content>', content);

				completedCallback(vueComponentString);
				delete _this.vueHtmlString;
			});
		}
	}

	Skeleton.prototype.setImgStyle = function (parent, sub, completedCallback) {
		var _this = this;
		var {
			topOffset,
			leftOffset,
			offsetElementWidth,
			offsetElementHeight
		} = _this.elementLocation.relative(parent, sub);
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

		if (!_this.imgHtmlString) _this.imgHtmlString = '';
		_this.imgHtmlString += `<div class='${_this.className}' style='${style}'></div>`;

		if (typeof completedCallback === 'function' && !_this.setImgStyleTimeout) {
			clearTimeout(_this.setImgStyleTimeout);
			_this.setImgStyleTimeout = setTimeout(function () {
				var width = parent.offsetWidth / SCREEN_WIDTH * 100;
				var height = parent.offsetHeight / SCREEN_HEIGHT * 100;
				var containerStyle = `
					overflow: hidden;
					position: relative;
					width: ${width}vw;
					height: ${height}vh;
				`;
				var content = `<div style='${containerStyle}'>${_this.imgHtmlString}</div>`;
				var svgString = `<svg xmlns='http://www.w3.org/2000/svg' width='${SCREEN_WIDTH}' height='${SCREEN_HEIGHT}'>
					<foreignObject width="100%" height="100%">
						<div xmlns="http://www.w3.org/1999/xhtml">${content}</div>
					</foreignObject>
				</svg>`;

				completedCallback(svgString);
				delete _this.imgHtmlString;
			});
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