const PENDING = 'pending';
const FULFILLED = 'fulfilled';
const REJECTED = 'rejected';


class MyPromise {
    /**
     * 
     * @param {Function} executor 任务执行器,立即执行
     */
    constructor(executor) {
        this._state = PENDING;
        this._value = undefined;
        this._handlers = [];     // 保存then回调函数队列
        try {
            executor(this._resolve.bind(this), this._reject.bind(this));
        } catch (error) {
            this._changeState(REJECTED, error);
        }
    }
    /**
     * 
     * @param {String} newState 修改状态
     * @param {any} value 修改值
     * @returns 
     */
    _changeState(newState, value) {
        if (this._state !== PENDING) {
            return;
        }
        this._state = newState;
        this._value = value;
        this._runHandlers()
    }

    _resolve(data) {
        this._changeState(FULFILLED, data);
    }

    _reject(reason) {
        this._changeState(REJECTED, reason);

    }

    /**
     * 
     * @param {Function} executor 
     * @param {String} state 
     * @param {Function} resolve 让then返回的promise成功
     * @param {Function} reject 让then返回的promise失败
     */
    _pushHandler(executor, state, resolve, reject) {
        this._handlers.push({
            executor,
            state,
            resolve,
            reject
        });
    }

    _runHandlers() {
        if (this._state === PENDING) {
            return
        }
        // console.log(`处理了${this._handlers.length}次handlers函数`);
        // console.log(this._handlers);
        while (this._handlers[0]) {
            const handler = this._handlers[0];
            this._runOneHandler(handler)
            this._handlers.shift();
        }
    }
    _runOneHandler({ executor, state, resolve, reject }) {
        runMicroTask(() => {
            if (this._state !== state) {
                return
            }
            // then回调函数传的不是函数(状态穿透)
            if (typeof executor !== 'function') {
                this._state === FULFILLED ? resolve(this._value) : reject(this._value);
            }
            try {
                // then回调函数的参数this._value
                const result = executor(this._value)
                if (isPromise(result)) {
                    result.then(resolve, reject)
                } else {
                    resolve(result)
                }
            } catch (error) {
                reject(error)
            }
        })
    }

    then(onFulfilled, onRejected) {
        return new MyPromise((resolve, reject) => {
            this._pushHandler(onFulfilled, FULFILLED, resolve, reject)
            this._pushHandler(onRejected, REJECTED, resolve, reject)
            this._runHandlers()
        });
    }

    all(promises) {
        if (!Array.isArray(promises)) {
            return new MyPromise((resolve, reject) => {
                reject(new TypeError('参数必须为数组'))
            })
        }
    }
}


/**
 * 
 * @param {Function} callback // 将回调函数放入微任务队列中
 */
const runMicroTask = (callback) => {
    if (process && process.nextTick) {
        process.nextTick(callback);
    } else if (MutationObserver) {
        const p = document.createElement('p')
        const observer = new MutationObserver(callback);
        observer.observe(p, {
            attributes: true
        });
        p.innerHTML = '1';
    } else {
        setTimeout(callback, 0);
    }
}

/**
 * 
 * @param {any} obj 判断是否为promise对象
 * @returns 
 */
const isPromise = (obj) => {
    return !!(obj && typeof obj === 'object' && typeof obj.then === 'function')
}

const promise1 = new MyPromise((resolve) => {
    resolve(1)
});
const promise2 = new MyPromise((resolve) => {
    resolve(2)
});
const p = new MyPromise().all(promise1)
console.log(p);