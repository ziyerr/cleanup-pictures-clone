export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center">
        <h1 className="text-3xl font-bold text-green-600 mb-4">
          🎉 项目运行正常！
        </h1>
        <p className="text-gray-600 mb-4">
          如果您能看到这个页面，说明 Next.js 项目已经成功启动。
        </p>
        <div className="space-y-2 text-sm text-gray-500">
          <p>✅ Next.js 15.3.3 运行中</p>
          <p>✅ TypeScript 编译成功</p>
          <p>✅ 环境变量加载正常</p>
          <p>✅ 服务器监听端口 3000</p>
        </div>
        <div className="mt-6">
          <a 
            href="/" 
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
          >
            返回首页
          </a>
        </div>
      </div>
    </div>
  );
}
