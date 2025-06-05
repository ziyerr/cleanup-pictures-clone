import { Button } from './ui/button';
import { ArrowDown, ArrowLeft } from 'lucide-react';

export default function APISection() {
  return (
    <section id="api" className="py-16 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Title */}
        <h2 className="text-4xl lg:text-5xl font-bold text-center mb-8">
          开发者API
        </h2>

        <p className="text-xl text-gray-600 text-center mb-16 max-w-3xl mx-auto">
          将IP生成能力集成到您的应用中，为用户提供个性化的创作体验
        </p>

        {/* API Workflow Diagram */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            {/* Your Application */}
            <div className="text-center">
              <div className="bg-cleanup-green rounded-2xl px-6 py-4 inline-block mb-4">
                <span className="text-black font-bold text-lg">您的应用</span>
              </div>
              <ArrowDown className="w-6 h-6 mx-auto text-gray-400 lg:hidden" />
            </div>

            {/* Arrow for desktop */}
            <div className="hidden lg:flex justify-center">
              <ArrowDown className="w-6 h-6 text-gray-400 rotate-90" />
            </div>

            {/* Input Section */}
            <div className="text-center">
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-4">
                <img
                  src="https://ext.same-assets.com/1651265233/915845048.jpeg"
                  alt="用户上传图片"
                  className="w-32 h-24 object-cover rounded-lg shadow-md"
                />
                <span className="text-gray-600 font-medium">+</span>
                <div className="w-32 h-24 bg-cleanup-green/20 rounded-lg flex items-center justify-center border-2 border-dashed border-cleanup-green">
                  <span className="text-black text-sm font-medium">风格描述</span>
                </div>
              </div>
              <p className="text-gray-600 font-medium">图片 + 风格需求</p>
              <ArrowDown className="w-6 h-6 mx-auto text-gray-400 mt-4 lg:hidden" />
            </div>
          </div>

          {/* Second Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center mt-8">
            {/* Arrow down for mobile */}
            <div className="lg:hidden" />

            {/* Popverse API */}
            <div className="text-center lg:order-2">
              <ArrowDown className="w-6 h-6 mx-auto text-gray-400 mb-4" />
              <div className="flex items-center justify-center space-x-2 bg-black rounded-xl px-4 py-3">
                <div className="w-8 h-8 bg-cleanup-green rounded-md flex items-center justify-center">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-black"
                  >
                    <path
                      d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <span className="text-lg font-bold text-white">Popverse API</span>
              </div>
            </div>

            {/* Arrow for desktop */}
            <div className="hidden lg:flex justify-center lg:order-1">
              <ArrowLeft className="w-6 h-6 text-gray-400" />
            </div>

            {/* Result */}
            <div className="text-center lg:order-3">
              <ArrowDown className="w-6 h-6 mx-auto text-gray-400 mb-4 lg:hidden" />
              <div className="grid grid-cols-2 gap-2 max-w-32 mx-auto">
                <img
                  src="https://ext.same-assets.com/1651265233/915845048.jpeg"
                  alt="生成的IP形象"
                  className="w-full h-16 object-cover rounded-lg shadow-md"
                />
                <div className="space-y-1">
                  <div className="bg-cleanup-green/20 rounded p-1 text-xs">📱</div>
                  <div className="bg-cleanup-green/20 rounded p-1 text-xs">🗝️</div>
                  <div className="bg-cleanup-green/20 rounded p-1 text-xs">🎪</div>
                </div>
              </div>
              <p className="text-gray-600 font-medium mt-2">IP + 周边</p>
            </div>

            {/* Arrow for desktop result */}
            <div className="hidden lg:flex justify-center lg:order-4">
              <ArrowLeft className="w-6 h-6 text-gray-400" />
            </div>
          </div>
        </div>

        {/* API Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-gray-50 rounded-2xl p-6 text-center">
            <div className="w-12 h-12 bg-cleanup-green rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-black font-bold">⚡</span>
            </div>
            <h3 className="text-xl font-bold mb-2">高性能处理</h3>
            <p className="text-gray-600">平均响应时间 &lt; 3秒，支持并发处理</p>
          </div>

          <div className="bg-gray-50 rounded-2xl p-6 text-center">
            <div className="w-12 h-12 bg-cleanup-green rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-black font-bold">🔧</span>
            </div>
            <h3 className="text-xl font-bold mb-2">简单集成</h3>
            <p className="text-gray-600">RESTful API，详细文档，多语言SDK</p>
          </div>

          <div className="bg-gray-50 rounded-2xl p-6 text-center">
            <div className="w-12 h-12 bg-cleanup-green rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-black font-bold">🔒</span>
            </div>
            <h3 className="text-xl font-bold mb-2">安全可靠</h3>
            <p className="text-gray-600">企业级安全，数据加密，99.9%可用性</p>
          </div>
        </div>

        {/* Description and CTA */}
        <div className="text-center">
          <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
            使用 Popverse 高质量、高可用性的IP生成API，立即为您的产品赋能
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              className="bg-cleanup-green hover:bg-cleanup-green/90 text-black px-8 py-3 rounded-full font-medium text-lg"
            >
              查看API文档
            </Button>
            <Button
              variant="outline"
              className="border-black text-black hover:bg-black hover:text-white px-8 py-3 rounded-full font-medium text-lg"
            >
              申请API密钥
            </Button>
          </div>
        </div>

        {/* Code Example */}
        <div className="mt-16 bg-gray-900 rounded-2xl p-6 max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-bold">API 示例</h3>
            <span className="text-gray-400 text-sm">JavaScript</span>
          </div>
          <pre className="text-green-400 text-sm overflow-x-auto">
{`const response = await fetch('https://api.popverse.ai/generate', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    image: 'base64_image_data',
    style: '可爱的卡通风格，大眼睛',
    products: ['phone-case', 'keychain', 'sticker']
  })
});

const result = await response.json();
console.log(result.ip_character_url);
console.log(result.products);`}
          </pre>
        </div>
      </div>
    </section>
  );
}
