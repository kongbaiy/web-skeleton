const HASH_FILTER_STR = /\#|\//g;
const REG_EXP_PX = /\s+|px/gi;
const SCREEN_WIDTH = window.screen.width;
const SCREEN_HEIGHT = window.screen.height;

const reactRenderTemplate = `import React from 'react';
const Skeleton = (props) => {
	const { visible } = props;
	return (
		<div hidden={visible}>
			<style>
				@keyframes <keyframesName> {'{0% {opacity: 1}50%{opacity: .5}100% {opacity: 1}}'}
				.<className> {'{animation: <keyframesName> 1s linear infinite;}'}
			</style>
			<content>
		</div>
	)
}
export default Skeleton
`;

const getId = ()=> {
	let abc = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'g', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u',
		'v', 'w', 'x', 'y', 'z'
	];
	let [max, min] = [Math.floor(Math.random() * (10 - 7 + 1) + 1), Math.floor(Math.random() * (17 - 10 + 1) + 17)];
	abc = abc.sort(() => 0.4 - Math.random()).slice(max, min).slice(0, 8).join("");
	let a = new Date().getTime() + abc;
	return a
}

export default class Skeleton {
	skeletonChildNum = 0;
	skeletonChildCount = 0;
	skeletonTemlate = '';
	rootElement;
	dowloadMode;
	skeletonClassName;
	skeletonKeyframesName;
	createSkeletonTemlateMatchFun = {};
	createSkeletonDowloadMatchFun = {};
	constructor(config) {
		this.config = config;
		window.addEventListener('load', () => {
			window.addEventListener('hashchange', this.handleHashChange.call(this));
		});
	}

	handleHashChange() {
		const config = this.config;
		const hashValue = this.getHashPath();
		const [{
			rootElement = document.body,
			dowloadMode = 'img'
		}] = config.filter(item => item.path.replace(/\//, '') === hashValue);
		
		this.skeletonClassName = `s_${getId()}`;
		this.skeletonKeyframesName = `s_${getId()}`;
		if (rootElement instanceof Element) {
			const allElement = rootElement.getElementsByTagName('*').length;
			const allScript = rootElement.getElementsByTagName('script').length;
			const allNoScript = rootElement.getElementsByTagName('noscript').length;
			const fileName = window.location.pathname.replace('.html', '');
			
			this.createSkeletonTemlateMatchFun = {
				react: (element) => this.handleReactSkeletonStyle(element),
				img: (element) => this.handleImgSkeletonStyle(element)
			};
			this.createSkeletonDowloadMatchFun = {
				react: () => this.downloadReactComponent(fileName),
				img: () => this.downloadImg(fileName)
			}
			this.rootElement = rootElement;
			this.dowloadMode = dowloadMode;
			this.skeletonChildCount = allElement - (allScript + allNoScript);
			this.createSkeleton(rootElement);
		}
	}

	getHashPath() {
		return window.location.hash.replace(HASH_FILTER_STR, '')
	}

	createSkeleton(element) {
		const {
			getStyle,
			dowloadMode,
			skeletonClassName,
			createSkeletonTemlateMatchFun,
			createSkeletonDowloadMatchFun
		} = this;

		for (let i = 0; i < element?.children?.length; i++) {
			const child = element.children[i];

			if (child.localName !== 'script' && child.localName !== 'noscript') {
				const isViewport = this.isInViewport(child);
				const isVisible = this.isVisible(child);

				this.skeletonChildNum += 1;
				if (
					isViewport &&
					isVisible &&
					!child.children.length &&
					getStyle(child, 'width').length &&
					getStyle(child, 'height').length
				) {
					createSkeletonTemlateMatchFun[dowloadMode] && createSkeletonTemlateMatchFun[dowloadMode](child);
				}
				child.children.length > 0 && this.createSkeleton(child);
			}
		}

		if (this.skeletonChildNum === this.skeletonChildCount) {
			createSkeletonDowloadMatchFun[dowloadMode] && createSkeletonDowloadMatchFun[dowloadMode]();
		}
	}

	isInViewport(element) {
		const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
		const offsetTop = element.offsetTop;
		const windowHeight = window.innerHeight;
		const elementHeight = element.offsetHeight;

		return (
			offsetTop - scrollTop < windowHeight &&
			offsetTop - scrollTop + elementHeight > 0
		);
	}

	isVisible(element) {
		const {
			getStyle
		} = this;

		if (
			getStyle(element, 'display') === 'none' ||
			getStyle(element, 'visibility') === 'hidden' ||
			getStyle(element, 'opacity') == 0 ||
			element.hidden
		) return false;
		return true;
	}

	getStyle(element, attrName) {
		const value = window.getComputedStyle ?
			window.getComputedStyle(element)[attrName] :
			element.currentStyle[attrName];

		return value
	}

	getElementOffset(element) {
		if (!element instanceof Element) return {};

		const {
			getStyle
		} = this;
		const {
			top,
			left,
			width,
			height
		} = element.getBoundingClientRect();
		const paddingTop = parseFloat(getStyle(element, 'paddingTop').replace(REG_EXP_PX, ''));
		const paddingBottom = parseFloat(getStyle(element, 'paddingBottom').replace(REG_EXP_PX, ''));
		const topOffset = top / SCREEN_HEIGHT * 100 + paddingTop / SCREEN_HEIGHT * 100;
		const leftOffset = left / SCREEN_WIDTH * 100;
		const offsetElementWidth = width / SCREEN_WIDTH * 100;
		const offsetElementHeight = Math.abs((height / SCREEN_HEIGHT * 100) - (paddingTop + paddingBottom) /
			SCREEN_HEIGHT * 100);

		return {
			topOffset,
			leftOffset,
			offsetElementWidth,
			offsetElementHeight
		}
	}
	
	handleReactSkeletonStyle(element) {
		const { getStyle, skeletonClassName } = this;
		const {
			topOffset,
			leftOffset,
			offsetElementWidth,
			offsetElementHeight
		} = this.getElementOffset(element);
		const elemetBorderRadius = getStyle(element, 'borderRadius');
		
		let elementStyle = `
			position: 'fixed', 
			top: '${topOffset}%',
			left: '${leftOffset}%', 
			boxSizing: 'border-box', 
			width: '${offsetElementWidth}%', 
			height: '${offsetElementHeight}%', 
			backgroundColor: '#ecf0f2'
		`;
		
		if (parseFloat(elemetBorderRadius.replace(/\D/g, '')) > 0)
			elementStyle += `, borderRadius: '${elemetBorderRadius}'`;
						
		this.skeletonTemlate += `<div className='${skeletonClassName}' style={{${elementStyle}}}></div>`;
	}
	
	handleImgSkeletonStyle(element) {
		const { getStyle, skeletonClassName } = this;
		const {
			topOffset,
			leftOffset,
			offsetElementWidth,
			offsetElementHeight
		} = this.getElementOffset(element);
		const elemetBorderRadius = getStyle(element, 'borderRadius');
		let elementStyle = `
			position: fixed;
			top: ${topOffset}%;
			left: ${leftOffset}%;
			box-sizing: border-box;
			width: ${offsetElementWidth}%;
			height: ${offsetElementHeight}%;
			background-color: #ecf0f2;
		`;
		
		if (parseFloat(elemetBorderRadius.replace(/\D/g, '')) > 0)
			elementStyle += `border-radius: ${elemetBorderRadius};`;
		
		this.skeletonTemlate += `<div class='${skeletonClassName}' style='${elementStyle}'></div>`;
	}

	getImgSkeletonTemlate() {
		const { skeletonTemlate } = this;

		return `<svg xmlns='http://www.w3.org/2000/svg' width='${SCREEN_WIDTH}' height='${SCREEN_HEIGHT}'>
	        <foreignObject width="100%" height="100%">
                <div xmlns="http://www.w3.org/1999/xhtml">${skeletonTemlate}</div>
	        </foreignObject>
	    </svg>`;
	}

	drawImage(callback) {
		const {
			rootElement,
			getStyle
		} = this;
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext("2d");
		const width = getStyle(rootElement, 'width').replace(REG_EXP_PX, '');
		const height = getStyle(rootElement, 'height').replace(REG_EXP_PX, '');
		canvas.width = width;
		canvas.height = height;

		const base64 = 'data:image/svg+xml,' + encodeURIComponent(
			this.getImgSkeletonTemlate()
		);
		
		const img = document.createElement('img');
		img.setAttribute('src', base64);
		img.addEventListener('load', (e) => {
			ctx.drawImage(e.target, 0, 0);
			if (typeof callback === 'function') callback(canvas.toDataURL());
		});
	}

	downloadImg(filename = '', format = 'png') {
		this.drawImage(url => {
			if (!url) return;
			const oA = document.createElement('a');
			oA.download = `${filename}.${format}`; // 设置下载的文件名，默认是'下载'
			oA.href = url;
			document.body.appendChild(oA);
			oA.click();
			oA.remove(); // 下载之后把创建的元素删除
		});
	}
	
	createReactSkeletonComponent() {
		const { skeletonTemlate, skeletonClassName, skeletonKeyframesName } = this;
		let compileTemplate = reactRenderTemplate
		.replaceAll('<className>', skeletonClassName)
		.replaceAll('<keyframesName>', skeletonKeyframesName)
		.replaceAll('<content>', skeletonTemlate);
		return compileTemplate
	}
	
	downloadReactComponent(filename) {
		const oA = document.createElement('a');
		const content = this.createReactSkeletonComponent();
		oA.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
		oA.setAttribute('download', `${filename}.jsx`);
		  
		oA.style.display = 'none';
		document.body.appendChild(oA);
		oA.click(); 
		oA.remove();
	}
}
