'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import { saveUserIPCharacter } from '@/lib/supabase';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import SecondaryHero from '@/components/SecondaryHero';
import UseCases from '@/components/UseCases';
import Testimonials from '@/components/Testimonials';
import Partners from '@/components/Partners';
import Pricing from '@/components/Pricing';
import FAQ from '@/components/FAQ';
import APISection from '@/components/APISection';
import IPShowcaseCTA from '@/components/BackgroundRemovalCTA';
import Footer from '@/components/Footer';
import ServiceStatusBanner from '@/components/ServiceStatusBanner';

export default function HomeClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser } = useUser();

  useEffect(() => {
    // 处理认证后的IP保存
    const handleAuthCallback = async () => {
      const saveIP = searchParams.get('save_ip');
      
      console.log('首页 handleAuthCallback:', { saveIP, currentUser: !!currentUser });
      
      if (saveIP === 'true' && currentUser) {
        const pendingIPData = sessionStorage.getItem('pending_ip_save');
        
        console.log('检查待保存的IP数据:', { 
          hasPendingData: !!pendingIPData,
          pendingData: pendingIPData 
        });
        
        if (pendingIPData) {
          try {
            const ipData = JSON.parse(pendingIPData);
            console.log('检测到待保存的IP形象，正在保存...', ipData);
            
            const savedIP = await saveUserIPCharacter(
              currentUser.id,
              ipData.name,
              ipData.imageUrl
            );
            
            console.log('IP形象保存成功:', savedIP);
            console.log('准备跳转到工作坊，IP ID:', savedIP.id);
            
            // 清除临时数据
            sessionStorage.removeItem('pending_ip_save');
            
            // 跳转到工作坊查看保存的IP
            console.log('执行跳转到:', `/workshop?ipId=${savedIP.id}`);
            router.push(`/workshop?ipId=${savedIP.id}`);
          } catch (error) {
            console.error('保存IP形象失败:', error);
            // 移除URL参数但留在首页
            router.replace('/');
          }
        } else {
          console.log('没有待保存数据，直接跳转工作坊');
          // 没有待保存数据，直接跳转工作坊
          router.push('/workshop');
        }
      }
    };

    handleAuthCallback();
  }, [searchParams, currentUser, router]);

  return (
    <main className="min-h-screen bg-white">
      <Header />
      <HeroSection />
      <SecondaryHero />
      <UseCases />
      <Testimonials />
      <Partners />
      <Pricing />
      <FAQ />
      <APISection />
      <IPShowcaseCTA />
      <Footer />
    </main>
  );
}