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
