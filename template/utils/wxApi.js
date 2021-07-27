
function apiScopeOauth(scope) {
    return new Promise((resolve, reject) => {
        wx.getSetting({
            success(res) {
                if (!res.authSetting[scope]) {
                    wx.authorize({
                        scope: scope,
                        success: () => {
                            resolve();
                        },
                        fail: () => {
                            reject();
                            let content = ''
                            if (scope == 'scope.record') {
                                content = '录音功能受限，您将无法使用录音功能！'
                            }
 else if (scope == 'scope.writePhotosAlbum') {
                                content = '您拒绝了保存相册权限，无法使用哦，去打开吧~'
                            }
                            wx.showModal({
                                title: '提示',
                                content: content,
                                showCancel: true,
                                confirmColor: '#228aff',
                                confirmText: '去授权',
                                complete: res => {
                                    if (res.confirm) {
                                        wx.openSetting();
                                    }
                                }
                            });
                        }
                    });
                    return;
                }
                resolve();
            }
        });
    });
}

function apiSubscribeMessage(ids) {
    return new Promise((resolve, reject) => {
        wx.requestSubscribeMessage({
            tmplIds: ids,
            complete: res => {
                resolve(res);
            },
        });
    });
}

module.exports = {
    apiScopeOauth,
    apiSubscribeMessage
};
