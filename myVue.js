const compileType = {
    getValue(content, vm) {
        let result = content.split('.').reduce((data, currentVal) => {
            return data[currentVal]
        }, vm.$data)
        return result
    },
    text(node, content, vm) {
        let value
        if (/\{\{(.+?)\}\}/.test(content)) {
            value = content.replace(/\{\{(.+?)\}\}/g, (...args) => {
                return this.getValue(args[1], vm)
            })
        }
        else {
            value = this.getValue(content, vm)
        }
        this.updater.textUpdater(node, value)
    },
    html(node, content, vm) {
        const value = this.getValue(content, vm)
        this.updater.htmlUpdater(node, value)
    },
    model(node, content, vm) {
        const value = this.getValue(content, vm)
        this.updater.modelUpdater(node, value)
    },
    on(node, content, vm, eventName) {
        let fn = vm.$options.methods && vm.$options.methods[content]
        node.addEventListener(eventName, fn.bind(vm), false);
    },
    bind(node, content, vm, eventName) {
        const value = this.getValue(content, vm)
        console.log(eventName);

        node.setAttribute(eventName, value)

    },
    //更新函数
    updater: {
        textUpdater(node, value) {
            node.textContent = value
        },
        htmlUpdater(node, value) {
            node.innerHTML = value
        },
        modelUpdater(node, value) {
            node.value = value
        }
    }
}
class Compile {
    constructor(el, vm) {
        this.el = this.isElemengtNode(el) ? el : document.querySelector(el)
        console.log(this.el)
        this.vm = vm
        //1 获取文档碎片对象 并放入内存之中 可以减少页面的重排和重绘
        const fragment = this.node2Fragment(this.el)
        //2 编译文档碎片模板
        this.compile(fragment)
        //console.log(fragment);
        //3 追加子元素到根元素
        this.el.appendChild(fragment)
    }
    compile(fragment) {
        //1 获取每个子节点
        const childNodes = fragment.childNodes;
        [...childNodes].forEach(child => {
            if (this.isElemengtNode(child)) {
                //是元素节点 需要编译
                //console.log('元素节点', child)

                //判断子节点是否仍有孩子节点 若有则继续遍历
                if (child.childNodes && child.childNodes.length) {
                    this.compile(child)
                }
                this.compileElement(child)

            } else {
                //是文本节点
                //编译文本节点
                //console.log('文本节点', child)
                this.compileText(child)
            }

        })
    }
    compileElement(node) {//编译元素节点 如 v-html v-text
        let attributes = node.attributes
        attributes = [...attributes]
        attributes.forEach(attr => {
            const { name, value } = attr
            console.log(name)
            console.log(value)
            if (this.isDirective(name)) {
                const directive = name.split('-')[1] //text html model on:click
                const [dirName, eventName] = directive.split(':') //click
                compileType[dirName](node, value, this.vm, eventName)
                node.removeAttribute('v-' + directive)
            } else if (this.isEventName(name)) {//@click
                let [, eventName] = name.split('@')
                compileType['on'](node, value, this.vm, eventName)
                node.removeAttribute('@' + eventName)

            } else if (this.isBindName(name)) {//@click
                let [, eventName] = name.split(':')
                console.log(eventName);
                compileType['bind'](node, value, this.vm, eventName)
                node.removeAttribute(':' + eventName)
            }
        })
    }
    isEventName(attrName) {
        return attrName.startsWith('@')
    }
    isBindName(attrName) {
        return attrName.startsWith(':')
    }
    compileText(node) {//编译文本节点 如  {{}}
        const content = node.textContent
        if (/\{\{(.+?)\}\}/.test(content)) {
            compileType['text'](node, content, this.vm)
        }
    }
    isDirective(attrName) {
        return attrName.startsWith('v-')
    }
    node2Fragment(el) {
        //创建文档碎片
        const fragment = document.createDocumentFragment()
        let firstChild;
        while (firstChild = el.firstChild) {
            fragment.appendChild(firstChild)
        }
        return fragment
    }
    isElemengtNode(node) {//判断传入的是否为节点对象
        return node.nodeType === 1
    }
}
class myVue {
    constructor(options) {
        this.$el = options.el
        this.$data = options.data
        this.$options = options
        if (this.$el) {
            //1 实现一个数据观察者
            //2 实现指令解析器
            new Compile(this.$el, this)
        }
    }

}