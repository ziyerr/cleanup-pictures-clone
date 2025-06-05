import { Button } from './ui/button';

export default function Pricing() {
  const plans = [
    {
      name: '免费体验',
      price: '0',
      highlight: false,
      features: [
        '每月3次IP生成',
        '基础周边产品类型',
        '标准分辨率输出'
      ],
      buttonText: '免费开始',
      buttonStyle: 'outline'
    },
    {
      name: '创作者版',
      price: '29',
      priceNote: '每月',
      highlight: true,
      features: [
        '无限次IP生成',
        '30+周边产品类型',
        '高清分辨率输出',
        '优先生产排队',
        '专属客服支持'
      ],
      buttonText: '立即升级',
      buttonStyle: 'outline'
    },
    {
      name: '商业版',
      price: '199',
      priceNote: '每月',
      highlight: false,
      features: [
        '包含创作者版所有功能',
        '商用授权',
        '批量生成API',
        '定制化服务',
        '白标解决方案',
        '专属客户经理'
      ],
      buttonText: '联系销售',
      buttonStyle: 'outline',
      isEnterprise: true
    },
    {
      name: '开发者API',
      price: '',
      priceNote: '按使用量计费',
      highlight: false,
      features: [
        'RESTful API接口',
        '详细开发文档',
        '技术支持'
      ],
      buttonText: '查看文档',
      buttonStyle: 'outline'
    }
  ];

  return (
    <section id="pricing" className="py-16 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Title */}
        <h2 className="text-4xl lg:text-5xl font-bold text-center mb-8">
          价格方案
        </h2>

        <p className="text-xl text-gray-600 text-center mb-16 max-w-3xl mx-auto">
          选择适合您的方案，开启IP创作之旅。所有方案都支持众筹生产模式
        </p>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-6 border-2 transition-all ${
                plan.highlight
                  ? 'border-cleanup-green bg-cleanup-green/5 scale-105 shadow-lg'
                  : plan.isEnterprise
                  ? 'border-purple-200 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
              }`}
            >
              {/* Popular Badge */}
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-cleanup-green text-black px-4 py-2 rounded-full text-sm font-bold">
                    最受欢迎
                  </span>
                </div>
              )}

              {/* Plan Badge */}
              <div className="text-center mb-6">
                <span
                  className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${
                    plan.highlight
                      ? 'bg-cleanup-green text-black'
                      : plan.isEnterprise
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {plan.name}
                </span>
              </div>

              {/* Price */}
              <div className="text-center mb-8">
                {plan.price && (
                  <div className="flex items-baseline justify-center">
                    <span className="text-3xl font-bold">¥</span>
                    <span className="text-5xl lg:text-6xl font-bold">{plan.price}</span>
                  </div>
                )}
                {plan.priceNote && (
                  <p className="text-sm text-gray-600 mt-2">{plan.priceNote}</p>
                )}
                {!plan.price && plan.priceNote && (
                  <p className="text-lg font-medium text-gray-700">{plan.priceNote}</p>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start">
                    <svg
                      className={`w-5 h-5 mr-3 mt-0.5 flex-shrink-0 ${
                        plan.highlight
                          ? 'text-cleanup-green'
                          : plan.isEnterprise
                          ? 'text-purple-500'
                          : 'text-green-500'
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-gray-700">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Button */}
              {plan.buttonText && (
                <div className="text-center">
                  <Button
                    variant={plan.buttonStyle as 'outline'}
                    className={`w-full rounded-full py-3 font-medium transition-all ${
                      plan.highlight
                        ? 'bg-cleanup-green text-black hover:bg-cleanup-green/90 border-cleanup-green'
                        : plan.isEnterprise
                        ? 'bg-purple-600 text-white hover:bg-purple-700 border-purple-600'
                        : 'bg-black text-white hover:bg-gray-800 border-black'
                    }`}
                  >
                    {plan.buttonText}
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="mt-16 text-center">
          <div className="bg-gray-50 rounded-2xl p-8 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold mb-4">众筹生产说明</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              <div>
                <h4 className="font-semibold text-cleanup-green mb-2">🎯 生产门槛</h4>
                <p className="text-gray-600">单个IP产品达到30人预订即开始生产</p>
              </div>
              <div>
                <h4 className="font-semibold text-cleanup-green mb-2">⏱️ 生产周期</h4>
                <p className="text-gray-600">从开始生产到发货约15-20个工作日</p>
              </div>
              <div>
                <h4 className="font-semibold text-cleanup-green mb-2">💰 费用说明</h4>
                <p className="text-gray-600">只收取平台服务费，生产成本用户众筹分摊</p>
              </div>
              <div>
                <h4 className="font-semibold text-cleanup-green mb-2">🏆 质量保证</h4>
                <p className="text-gray-600">与专业制造商合作，确保产品质量</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
