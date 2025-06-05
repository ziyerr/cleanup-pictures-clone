export default function Testimonials() {
  return (
    <section className="py-16 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Title */}
        <h2 className="text-4xl lg:text-5xl font-bold text-center mb-16">
          用户<span className="highlight-black">真实评价</span>
        </h2>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Testimonial 1 */}
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6">
            {/* Profile Image */}
            <div className="flex-shrink-0">
              <img
                src="https://ext.same-assets.com/1651265233/1641842340.jpeg"
                alt="李小美"
                className="w-24 h-24 lg:w-32 lg:h-32 rounded-full object-cover border-4 border-gray-100 shadow-lg"
              />
            </div>

            {/* Quote Content */}
            <div className="flex-1 text-center lg:text-left">
              <blockquote className="text-lg lg:text-xl leading-relaxed text-gray-800 mb-4">
                "我上传了我家猫咪的照片，几分钟就生成了超可爱的卡通形象！
                <br />
                <br />
                现在我的<span className="highlight-green font-bold">手机壳、钥匙扣都是我家主子的专属周边</span>，朋友们都超羡慕！"
              </blockquote>

              {/* Author Info */}
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-black">李小美</h3>
                <p className="text-gray-600 font-medium">宠物主人 · 广州</p>
              </div>
            </div>
          </div>

          {/* Testimonial 2 */}
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6">
            {/* Profile Image */}
            <div className="flex-shrink-0">
              <div className="w-24 h-24 lg:w-32 lg:h-32 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-2xl">王</span>
              </div>
            </div>

            {/* Quote Content */}
            <div className="flex-1 text-center lg:text-left">
              <blockquote className="text-lg lg:text-xl leading-relaxed text-gray-800 mb-4">
                "作为设计师，这个工具大大提高了我的工作效率。
                <br />
                <br />
                <span className="highlight-green font-bold">从概念到完整产品线展示，只需要30分钟</span>，客户都被震撼到了！"
              </blockquote>

              {/* Author Info */}
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-black">王设计师</h3>
                <p className="text-gray-600 font-medium">创意总监 · 上海某广告公司</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="text-3xl lg:text-4xl font-bold text-cleanup-green mb-2">10,000+</div>
            <p className="text-gray-600">IP形象已生成</p>
          </div>
          <div className="text-center">
            <div className="text-3xl lg:text-4xl font-bold text-cleanup-green mb-2">156</div>
            <p className="text-gray-600">项目进入生产</p>
          </div>
          <div className="text-center">
            <div className="text-3xl lg:text-4xl font-bold text-cleanup-green mb-2">98%</div>
            <p className="text-gray-600">用户满意度</p>
          </div>
        </div>
      </div>
    </section>
  );
}
