import { jsx as _jsx, vnode } from 'snabbdom'

const ns = ['dataset', 'style', 'on', 'hook', 'props', 'attrs', 'data']

function clean (obj) {
    const t = obj
    for (const v in t) {
        if (typeof t[v] === 'object') {
            clean(t[v])
            if (t[v] && Object.getOwnPropertyNames(t[v]).length < 1) {
                delete t[v]
            }
        } else if (t[v] === undefined) {
            delete t[v]
        }
    }
    return t
}

const parseModules = data => {
    const {
        class: classNameAttr,
        props,
        attrs,
        dataset,
        style,
        on, // incative in @cycle
        hook,
        id,
        key,
        className: classNameDirect,
        ...others
    } = data

    const classX = classNameAttr || classNameDirect

    const classTxt =
        (typeof classX === 'string' || classX instanceof String) && classX
    const classObj = !classTxt && classX

    const saneData = {
        key,
        class: classObj || undefined,
        props: {
            ...props
        },
        attrs: {
            ...attrs,
            id,
            class: classTxt || undefined
        },
        dataset,
        style,
        hook
    }

    const cleaned = clean(
        Object.entries(others).reduce((data, e) => {
            const isModule = ns.find(ns => e[0].startsWith(ns + '-'))
            const [_modNS, key] = ((isModule && e[0]) || '').split(/-(.+)/)
            const modNS = isModule && (_modNS === 'data' ? 'dataset' : _modNS)
            const isStringVal =
                !isModule &&
                (typeof e[1] === 'string' || e[1] instanceof String)
            return isModule
                ? {
                    ...data,
                    [modNS]: {
                        ...data[modNS],
                        [key]: e[1]
                    }
                }
                : isStringVal
                    ? {
                        ...data,
                        attrs: {
                            ...data.attrs,
                            [e[0]]: e[1]
                        }
                    }
                    : {
                        ...data,
                        props: {
                            ...data.props,
                            [e[0]]: e[1]
                        }
                    }
        }, saneData)
    )
    return cleaned
}

const needParse = (sel, data) =>
    data && typeof data === 'object' && typeof sel !== 'function'

const isVnode = v => v && typeof v === 'object'

const isText = v => typeof v === 'string' || typeof v === 'number'

/**
 * jsx/tsx compatible factory function
 * see: https://www.typescriptlang.org/docs/handbook/jsx.html#factory-functions
 */
const jsx = (sel, data, ...children) =>
    _jsx(
        sel,
        (needParse(sel, data) ? parseModules(data) : data) || {},
        children
            .map(child =>
                isVnode(child)
                    ? child
                    : isText(child)
                        ? { text: child }
                        : undefined
            )
            .filter(v => v !== undefined && !(Array.isArray(v) && v.length < 1))
    )

const fragment = (_, children) =>
    vnode(undefined, undefined, children, undefined, undefined)

export { jsx, fragment }
