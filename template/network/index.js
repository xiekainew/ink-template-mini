const app = getApp();
const log = require("../utils/log.js")
class Network {
    constructor() {
        if (typeof __wxConfig == "object") {
            let version = __wxConfig.envVersion;
            if (version == "develop") {
                this.$base_url = "https://test-heya-reading.genshuixue.com"; // 本地
                // this.$base_url = "http://reading.vipgz4.idcfengye.com"; // 本地 http://reading.vipgz4.idcfengye.com
            } else if (version == "trial") {
                this.$base_url = "https://test-heya-reading.genshuixue.com"; // 体验版
            } else if (version == "release") {
                this.$base_url = "https://heya-reading.genshuixue.com"; // 正式
            }
        }
        this.$base_url = "https://heya-reading.genshuixue.com"; // 正式
        this.$token = null;
        this.$jwt = null;
        this.$diyLoading = false;
    }
    __error(response, handler, retry) {
        let message = response ? response.data : null;
        let tiptitle = message ? message.message : "";
        let resCode = response && response.data && response.data.code
        if (message && message.code == 2001) {
            wx.showModal({
                title: "提示",
                content: message.message,
                showCancel: false,
                confirmText: "确定",
                confirmColor: "#b4946f",
                success: (res) => {
                    // 点击确定能返回上一个页面
                    let pages = getCurrentPages();
                    if (pages.length > 1) {
                        wx.navigateBack();
                    }
                },
            });
            return;
        }
        if (resCode == 4000) {
            this.__error400(response.data)
            return
        }

        if (response && response.statusCode == 429 || resCode == 4029) {
            // 429默认错误不提示
            return;
        }

        if (response && response.statusCode == 401 || resCode == 4001) {
            tiptitle = "登录已过期，请重新登录!";
            wx.setStorageSync("token", "");
            this.$token = "";
            if (app.globalData.needReload) return;
            app.globalData.needReload = true;

            wx.reLaunch({
                url: "/pages/task/task",
            });

            return;
        }
        if (response && response.statusCode == 503) {
            wx.showModal({
                title: "系统维护提示",
                content: "系统正在维护...给你带来不便，非常抱歉！稍后将恢复正常。",
                showCancel: false,
                confirmText: "知道了",
            });
            return;
        }
        wx.showModal({
            title: "提示",
            content: tiptitle || "加载失败",
            showCancel: !message,
            confirmText: message ? "确定" : "重新加载",
            confirmColor: "#b4946f",
            success: (res) => {
                if (res.confirm && retry && !message) {
                    this.__request(retry.url, retry.data, retry.method).then(retry.resolve, retry.reject);
                } else {
                    // if (handler) {
                    //   handler()
                    // }
                }
            },
        });
    }

    __unionid() {
        let unionid = app.globalData.userInfo.unionid;
        if (!unionid) {
        }
        return app.globalData.userInfo.unionid;
    }
    __error400(res) {
        let url = this.currentUrl
        wx.showModal({
            title: '提示',
            content: res.message,
            showCancel: false,
            success: function(res) {
                // wx.reLaunch({
                //   url: '/pages/task/task'
                // })
            }
        })
        log.setFilterMsg('400error')
        log.info('network210:' + url + ':' + res.message)
    }

    __request(url, data = {}, method = "get") {
        // 500ms 之后没返回则开启loading弹层
        if (!this.$diyLoading) {
            clearTimeout(this.$load_timer);
            this.$load_timer = setTimeout(() => {
                wx.showLoading({
                    title: "正在加载...",
                    mask: true,
                });
            }, 500);
        }
        data = data || {};
        let header = this.$token
            ? {
                  Authorization: "Bearer " + this.$token,
              }
            : {};
        header["Accept"] = "application/json";
        header["systemInfo"] = JSON.stringify(app.globalData.systemInfo);
        return new Promise((resolve, reject) => {
            reject = reject || (() => {});
            let request_url = this.$base_url + url;
            console.log("请求地址====>", request_url, "请求参数", data);
            wx.request({
                url: request_url,
                data,
                header,
                method: method.toUpperCase(),
                dataType: "json",
                success: (response) => {
                    if (response.statusCode == 200) {
                        if (response.data.hasOwnProperty('code') && response.data.code !== 200 && response.data.code !== 2000) {
                            this.currentUrl = url
                            this.__error(response, reject)
                            reject()
                            return
                        }
                        // if (response.data.code === 4000) {
                        //     this.__error400(response.data, url)
                        //     reject()
                        //     return
                        // }
                        app.globalData.needReload = false;
                        resolve(response.data);
                    } else {
                        reject();
                        if (response.data) {
                            this.__error(response, reject);
                        } else {
                            this.__error(null, reject, {
                                url,
                                data,
                                method,
                                resolve,
                                reject,
                            });
                        }
                    }
                },
                fail: (res) => {
                    reject(res);
                    this.__error(null, reject, {
                        url,
                        data,
                        method,
                        resolve,
                        reject,
                    });
                },
                complete: () => {
                    if (!this.$diyLoading) {
                        clearTimeout(this.$load_timer);
                        wx.hideLoading();
                    }
                },
            });
        });
    }

    set baseurl(url) {
        if (this.$base_url == url) return;
        this.$base_url = url;
        this.$base_url_changed = true;
    }

    get urlChanged() {
        let changed = this.$base_url_changed;
        this.$base_url_changed = false;
        return changed;
    }

    /**
     * 上传文件
     */
    uploadFile(url, filepath, name, data = {}) {
        wx.showLoading({
            title: "正在上传...",
            mask: true,
        });
        return new Promise((resolve, reject) => {
            let header = this.$token
                ? {
                      Authorization: "Bearer " + this.$token,
                  }
                : {};
            header["Accept"] = "application/json";
            wx.uploadFile({
                url: this.$base_url + url,
                filePath: filepath,
                name: name,
                formData: data,
                header,
                success: (response) => {
                    if (response.statusCode == 200) {
                        let data = JSON.parse(response.data);
                        resolve(data);
                    } else {
                        if (response.data) {
                            response.data = JSON.parse(response.data);
                        }
                        if (response.data) {
                            this.__error(response, reject);
                        } else {
                            this.__error(response.message, reject);
                        }
                    }
                },
                fail: (res) => {
                    this.__error(null, reject);
                },
                complete: () => {
                    wx.hideLoading();
                },
            });
        });
    }

    setDIYLoading(DIY) {
        this.$diyLoading = DIY;
    }

    /**
     * 注册token
     */
    setToken(token) {
        this.$token = token;
        //把token存到本地
        wx.setStorageSync("token", token);
        wx.setStorageSync("tokenTime", new Date().getTime());
    }
    checkToken() {
        if (wx.getStorageSync("token")) {
            let tokenTime = wx.getStorageSync('tokenTime')
            let nowTime = new Date().getTime()
            let isExpiry = nowTime - tokenTime > 1000 * 60 * 60 * 24 * 3.5
            if (isExpiry) {
                wx.setStorageSync('token', '')
            }
            this.$token = !isExpiry ? wx.getStorageSync("token") : '';
            return !isExpiry;
        } else {
            return false
        }
    }
    hasToken() {
        if (this.$token) {
            return true;
        } else if (wx.getStorageSync("token")) {
            this.$token = wx.getStorageSync("token")
            return true
        } else {
            return false;
        }
    }

    setJwt(jwt) {
        this.$jwt = jwt;
    }

    hasJwt() {
        return !!this.$jwt;
    }

    /**
     * 获取验证码
     */
    getCode(mobile) {
        return this.__request(
            "/api/connectsms",
            {
                mobile,
                sms_type: 4,
            },
            "post"
        );
    }
}

module.exports = new Network();
