export default function Partners() {
  const partners = [
    {
      name: '腾讯',
      logo: '/partners/partner-1.png',
      alt: '腾讯合作伙伴',
      description: '内容创作平台'
    },
    {
      name: '字节跳动',
      logo: '/partners/partner-2.svg',
      alt: '字节跳动合作伙伴',
      description: '创作者服务'
    },
    {
      name: '小红书',
      logo: '/partners/partner-3.svg',
      alt: '小红书合作伙伴',
      description: 'IP孵化平台'
    },
    {
      name: 'B站',
      logo: '/partners/partner-4.png',
      alt: 'B站合作伙伴',
      description: '视频创作生态'
    },
    {
      name: '泡泡玛特',
      logo: '/partners/partner-5.png',
      alt: '泡泡玛特合作伙伴',
      description: '潮玩制造商'
    }
  ];

  const achievements = [
    {
      number: '80万+',
      label: '注册创作者',
      description: '来自全球的创意人才',
      icon: '👨‍🎨'
    },
    {
      number: '1500万+',
      label: 'IP形象生成',
      description: '累计创作的角色数量',
      icon: '🎭'
    },
    {
      number: '200万+',
      label: '周边商品制作',
      description: '已完成的商品订单',
      icon: '🛍️'
    }
  ];

  return (
    <section className="bg-cleanup-green py-20 lg:py-28 relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 w-32 h-32 bg-black rounded-full"></div>
        <div className="absolute bottom-20 right-10 w-24 h-24 bg-black rounded-full"></div>
        <div className="absolute top-1/2 left-1/3 w-16 h-16 bg-black rounded-full"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        {/* Section Header */}
        <div className="mb-20">
          <h2 className="text-4xl lg:text-6xl font-bold text-black mb-6 tracking-tight">
            赋能<span className="relative">
              <span className="text-black">优秀创作者</span>
              <div className="absolute -bottom-2 left-0 right-0 h-1 bg-black/20 rounded-full"></div>
            </span>
          </h2>

          <p className="text-xl lg:text-2xl text-black/70 mb-8 max-w-4xl mx-auto leading-relaxed">
            与知名品牌和平台深度合作，为全球创作者提供
            <span className="font-semibold text-black"> AI驱动的IP生成</span> 和 
            <span className="font-semibold text-black"> 一站式周边制作</span> 服务
          </p>

          <div className="flex items-center justify-center gap-2 text-black/60">
            <span className="w-2 h-2 bg-black/40 rounded-full animate-pulse"></span>
            <span className="text-sm font-medium">已服务全球80+国家和地区</span>
            <span className="w-2 h-2 bg-black/40 rounded-full animate-pulse"></span>
          </div>
        </div>

        {/* Partners Grid */}
        <div className="mb-20">
          <h3 className="text-lg font-semibold text-black/80 mb-8 uppercase tracking-wider">
            信赖我们的品牌伙伴
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 lg:gap-8 items-center justify-items-center">
            {partners.map((partner, index) => (
              <div
                key={partner.name}
                className="group relative"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center justify-center w-full h-20 lg:h-24 p-4 bg-white/15 backdrop-blur-sm rounded-2xl border border-black/10 transition-all duration-500 group-hover:bg-white/25 group-hover:scale-105 group-hover:shadow-xl">
                  <img
                    src={partner.logo}
                    alt={partner.alt}
                    className="max-w-full max-h-full object-contain transition-all duration-300 filter opacity-70 group-hover:opacity-100"
                    style={{ 
                      maxWidth: '140px', 
                      maxHeight: '50px',
                      filter: 'brightness(0.2) contrast(1.2)',
                    }}
                    onLoad={(e) => {
                      // 移除滤镜，显示原始logo
                      e.currentTarget.style.filter = 'brightness(1) contrast(1)';
                    }}
                  />
                </div>
                
                {/* Tooltip */}
                <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                  <div className="bg-black/80 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap">
                    {partner.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Success Stories */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {achievements.map((achievement, index) => (
            <div
              key={achievement.label}
              className="group relative"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <div className="bg-white/15 backdrop-blur-sm rounded-3xl p-8 lg:p-10 border border-black/10 transition-all duration-500 group-hover:bg-white/20 group-hover:scale-105 group-hover:shadow-2xl">
                {/* Icon */}
                <div className="text-4xl mb-4 transform group-hover:scale-110 transition-transform duration-300">
                  {achievement.icon}
                </div>

                {/* Number */}
                <div className="text-4xl lg:text-5xl font-bold text-black mb-3 tracking-tight">
                  {achievement.number}
                </div>

                {/* Label */}
                <h4 className="text-lg lg:text-xl font-semibold text-black mb-2">
                  {achievement.label}
                </h4>

                {/* Description */}
                <p className="text-sm lg:text-base text-black/70 leading-relaxed">
                  {achievement.description}
                </p>

                {/* Progress Bar Animation */}
                <div className="mt-6 w-full h-1 bg-black/10 rounded-full overflow-hidden">
                  <div className="h-full bg-black/30 rounded-full transform -translate-x-full group-hover:translate-x-0 transition-transform duration-1000 ease-out"></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="mt-16 p-8 bg-white/10 backdrop-blur-sm rounded-3xl border border-black/10">
          <h4 className="text-2xl font-bold text-black mb-4">
            🚀 加入创作者生态
          </h4>
          <p className="text-black/70 mb-6 max-w-2xl mx-auto">
            成为下一个成功的IP创作者，让AI助力您的创意变现之路
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button className="bg-black text-cleanup-green px-8 py-3 rounded-full font-semibold transition-all duration-300 hover:bg-black/80 hover:scale-105">
              立即开始创作
            </button>
            <button className="border-2 border-black text-black px-8 py-3 rounded-full font-semibold transition-all duration-300 hover:bg-black hover:text-cleanup-green">
              了解合作方案
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
