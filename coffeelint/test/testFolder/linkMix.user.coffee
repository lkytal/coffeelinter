`// ==UserScript==
// @name						Text To link
// @description					Turn plain text URLs into clickable links, 把文字链接转换为可点击链接
// @author						lkytal
// @namespace					Lkytal
// @homepage					https://lkytal.github.io/
// @include						*
// @exclude						*pan.baidu.com/*
// @exclude						*renren.com/*
// @exclude						*exhentai.org/*
// @exclude						*music.google.com/*
// @exclude						*play.google.com/music/*
// @exclude						*mail.google.com/*
// @exclude						*docs.google.com/*
// @exclude						*www.google.*
// @exclude						*acid3.acidtests.org/*
// @exclude						*.163.com/*
// @exclude						*.alipay.com/*
// @version						2.8.4
// @icon						http://lkytal.qiniudn.com/link.png
// @grant						unsafeWindow
// @homepageURL					https://git.oschina.net/coldfire/GM
// @updateURL					https://git.oschina.net/coldfire/GM/raw/master/meta/linkMix.meta.js
// @downloadURL					https://git.oschina.net/coldfire/GM/raw/master/linkMix.user.js
// ==/UserScript==

"use strict";`

url_regexp = ///(
		(https?://|www\.)[\x21-\x7e]+[\w/]|
		(\w[\w._-]+\.(com|cn|org|net|info|tv|cc|gov|edu))(/[\x21-\x7e]*[\w/])?|
        ed2k://[\x21-\x7e]+\|/|
		thunder://[\x21-\x7e]+=
	)///gi

urlPrefixes = [
		'http://',
		'https://',
		'ftp://',
		'thunder://',
		'ed2k://'
	]

clearLink = (event) ->
	link = event.originalTarget ? event.target
	return unless link? && link.localName == "a" && link.className.indexOf("textToLink") != -1
	url = link.getAttribute "href"
	#console.log url
	for prefix in urlPrefixes
		return if url.indexOf(prefix) == 0

	link.setAttribute "href", "http://" + url

document.addEventListener("mouseover", clearLink)

setLink = (candidate) ->
	return if !candidate? or candidate.parentNode.className.indexOf("textToLink") != -1 or candidate.nodeName == "#cdata-section"
	text = candidate.textContent.replace url_regexp, '<a href="$1" target="_blank" class="textToLink">$1</a>'

	return if candidate.textContent.length == text.length
	span = document.createElement("span")
	span.innerHTML = text
	candidate.parentNode.replaceChild(span, candidate)

excludedTags = "a,svg,canvas,applet,input,button,area,pre,embed,frame,frameset,head,iframe,img,option,map,meta,noscript,object,script,style,textarea,code".split(",")

xPath = "//text()[not(ancestor::#{excludedTags.join(') and not(ancestor::')})]"

linkPack = (result, start) ->
	startTime = Date.now()

	while start + 10000 < result.snapshotLength
		setLink result.snapshotItem(i) for i in [start..start + 10000]
		start += 10000
		return if Date.now() - startTime > 2500

	setLink result.snapshotItem(i) for i in [start..result.snapshotLength]
	return

linkify = (node) ->
	result = document.evaluate(xPath, node, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null)
	linkPack result, 0

linkFilter = (node) ->
	for tag in excludedTags
		return NodeFilter.FILTER_REJECT if tag == node.parentNode.localName.toLowerCase()
	return NodeFilter.FILTER_ACCEPT

observePage = (root) ->
	tW = document.createTreeWalker(root, NodeFilter.SHOW_TEXT #+ NodeFilter.SHOW_ELEMENT,
		{
			acceptNode: linkFilter
		}, false)

	setLink tW.currentNode while tW.nextNode()
	return

observer = new window.MutationObserver (mutations) ->
	for mutation in mutations when mutation.type == "childList"
		observePage Node for Node in mutation.addedNodes
	return

linkMixInit = () ->
	return if window != window.top || window.document.title == ""
	#console.time('a')
	linkify document.body
	#console.timeEnd('a')
	observer.observe document.body, { childList: true, subtree: true }

setTimeout linkMixInit, 100
