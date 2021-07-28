module.exports = {
    questions: {
        name: {
            type: 'input',
            message: '请输入项目名称',
            required: true
        },
        description: {
            type: 'input',
            message: '请输入项目描述',
            default: '创新业务线小程序'
        },
        author: {
			type: 'input',
			message: '请输入项目作者'
		},
        deps: {
			type: 'checkbox',
			message: '请选择你需要的依赖 \n',
			choices: [
				{
					name: 'vant小程序组件库',
					value: 'vant',
                },
                {
                    name: 'vant小程序组件库私有化精简版',
                    value: 'sparkweapp',
                },
                {
					name: '哈勃小程序SDK',
					value: 'habo'
                },
                {
                    name: '日期时间处理工具dayjs',
                    value: 'dayjs'
                },
                {
                    name: '百家弹框组件',
                    value: 'dialog'
                },
                {
                    name: '星火weapp',
                    value: 'sparkweapp'
                }
			]
		}
    }
};
