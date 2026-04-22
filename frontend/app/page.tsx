"use client";

export default function HomePage() {
  return (
    <div className="font-body selection:bg-[#d0bcff] selection:text-[#3c0091] bg-[#131318] text-[#e4e1e9] overflow-x-hidden">
      {/* TopNavBar Shell */}
      <header className="fixed top-0 z-50 w-full bg-[#0F0F14] flex justify-between items-center px-6 py-3 border-b border-[#262631]">
        <div className="text-xl font-black tracking-tighter text-white font-['Inter']">VEKTOR</div>
        <nav className="hidden md:flex items-center gap-8">
          <a className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-gray-500 hover:text-white transition-colors" href="#">Control</a>
          <a className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-gray-500 hover:text-white transition-colors" href="#">Assets</a>
          <a className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-gray-500 hover:text-white transition-colors" href="#">Vaults</a>
          <a className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-gray-500 hover:text-white transition-colors" href="#">Terminal</a>
        </nav>
        <div className="flex items-center gap-4 text-[#d0bcff]">
          <button className="material-symbols-outlined scale-100 active:scale-[0.98] transition-transform hover:bg-[#16161F] p-2">settings</button>
        </div>
      </header>

      <main className="relative pt-24 min-h-screen">
        {/* Subtle Grid Background */}
        <div 
          className="fixed inset-0 opacity-30 pointer-events-none -z-10"
          style={{
            backgroundImage: `
              linear-gradient(to right, #1f1f24 1px, transparent 1px),
              linear-gradient(to bottom, #1f1f24 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }}
        />

        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 lg:px-12 py-24 md:py-40 grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8 flex flex-col justify-center">
            <div className="mb-6 inline-flex items-center gap-2 border border-[#494454] px-3 py-1 bg-[#0e0e13]">
              <span className="w-2 h-2 bg-[#4edea3] animate-pulse"></span>
              <span className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-tighter text-[#cbc3d7]">System Status: v4.0.2-stable // Protocol Active</span>
            </div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white leading-[0.9] tracking-tighter mb-8 font-['Inter']">
              Autonomous <br/>
              <span className="text-[#d0bcff]">DeFi Agent</span>
            </h1>
            <p className="max-w-xl text-[#cbc3d7] text-lg md:text-xl font-['Inter'] mb-10 leading-relaxed">
              A high-precision industrial instrument for decentralized liquidity management. Non-custodial, objective-driven, and purely algorithmic.
            </p>
            <div className="flex flex-wrap gap-4">
              <button className="border border-[#958ea0] px-8 py-4 font-['JetBrains_Mono'] text-xs uppercase tracking-widest text-[#e4e1e9] hover:bg-[#1f1f24] transition-all">
                View Documentation
              </button>
            </div>
          </div>
          
          <div className="lg:col-span-4 relative border-l border-[#494454] pl-8 hidden lg:block">
            <div className="sticky top-40 space-y-8">
              <div className="bg-[#1f1f24] p-6 border-t-2 border-[#d0bcff]">
                <h3 className="font-['JetBrains_Mono'] text-[10px] text-[#d0bcff] uppercase mb-4 tracking-widest">Network Status</h3>
                <div className="space-y-3 font-['JetBrains_Mono'] text-[11px]">
                  <div className="flex justify-between border-b border-[#131318] pb-1">
                    <span className="text-[#958ea0]">Mainnet Latency</span>
                    <span className="text-[#4edea3]">12ms</span>
                  </div>
                  <div className="flex justify-between border-b border-[#131318] pb-1">
                    <span className="text-[#958ea0]">Gas Price (Fast)</span>
                    <span className="text-[#e4e1e9]">18 Gwei</span>
                  </div>
                  <div className="flex justify-between border-b border-[#131318] pb-1">
                    <span className="text-[#958ea0]">Active Strategy</span>
                    <span className="text-[#e4e1e9]">Delta_Neutral_v2</span>
                  </div>
                </div>
              </div>
              
              <div className="p-6 bg-[#0e0e13] border-l border-[#d0bcff]">
                <div className="flex items-center gap-3 mb-4">
                  <span className="material-symbols-outlined text-[#d0bcff] text-sm">memory</span>
                  <span className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-widest">AI Reasoning Stream</span>
                </div>
                <div className="font-['JetBrains_Mono'] text-[11px] text-[#d0bcff]/80 space-y-2 opacity-80">
                  <p>&gt; Analyzing ETH-USDC pool volatility...</p>
                  <p>&gt; Calculating optimal rebalance range...</p>
                  <p>&gt; Liquidity concentration: 94.2%</p>
                  <p>&gt; Standing by for protocol initiation_</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Capabilities: Engineered List */}
        <section className="bg-[#1f1f24] py-24 border-y border-[#262631]">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-4">
              <div>
                <h2 className="font-['Inter'] text-3xl font-black text-white tracking-tight uppercase">Agent Capabilities</h2>
                <p className="font-['JetBrains_Mono'] text-[10px] text-[#958ea0] uppercase tracking-widest mt-2">Protocol Operating Standards</p>
              </div>
              <div className="h-px flex-grow mx-8 bg-[#494454] opacity-30 hidden md:block"></div>
              <span className="font-['JetBrains_Mono'] text-xs text-[#4edea3]">[ SECURE_ACCESS_GRANTED ]</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-0 border border-[#494454]">
              <div className="group p-8 border-b md:border-b-0 md:border-r border-[#494454] hover:bg-[#2a292f] transition-colors">
                <span className="font-['JetBrains_Mono'] text-[10px] text-[#958ea0] mb-8 block">01</span>
                <div className="material-symbols-outlined text-[#d0bcff] mb-6 text-3xl">monitoring</div>
                <h3 className="font-['Inter'] font-bold text-white mb-2 uppercase tracking-tight">Monitoring</h3>
                <p className="text-xs text-[#cbc3d7] leading-relaxed font-['Inter']">Real-time surveillance of pool health and market volatility indexes.</p>
              </div>
              
              <div className="group p-8 border-b md:border-b-0 md:border-r border-[#494454] hover:bg-[#2a292f] transition-colors">
                <span className="font-['JetBrains_Mono'] text-[10px] text-[#958ea0] mb-8 block">02</span>
                <div className="material-symbols-outlined text-[#d0bcff] mb-6 text-3xl">shortcut</div>
                <h3 className="font-['Inter'] font-bold text-white mb-2 uppercase tracking-tight">Bridging</h3>
                <p className="text-xs text-[#cbc3d7] leading-relaxed font-['Inter']">Optimized cross-chain asset migration with minimal slippage detection.</p>
              </div>
              
              <div className="group p-8 border-b md:border-b-0 md:border-r border-[#494454] hover:bg-[#2a292f] transition-colors">
                <span className="font-['JetBrains_Mono'] text-[10px] text-[#958ea0] mb-8 block">03</span>
                <div className="material-symbols-outlined text-[#d0bcff] mb-6 text-3xl">account_balance</div>
                <h3 className="font-['Inter'] font-bold text-white mb-2 uppercase tracking-tight">Staking</h3>
                <p className="text-xs text-[#cbc3d7] leading-relaxed font-['Inter']">Automated yield capture across validated governance protocols.</p>
              </div>
              
              <div className="group p-8 border-b md:border-b-0 md:border-r border-[#494454] hover:bg-[#2a292f] transition-colors">
                <span className="font-['JetBrains_Mono'] text-[10px] text-[#958ea0] mb-8 block">04</span>
                <div className="material-symbols-outlined text-[#d0bcff] mb-6 text-3xl">how_to_vote</div>
                <h3 className="font-['Inter'] font-bold text-white mb-2 uppercase tracking-tight">Voting</h3>
                <p className="text-xs text-[#cbc3d7] leading-relaxed font-['Inter']">Delegated algorithmic governance based on defined risk profiles.</p>
              </div>
              
              <div className="group p-8 hover:bg-[#2a292f] transition-colors">
                <span className="font-['JetBrains_Mono'] text-[10px] text-[#958ea0] mb-8 block">05</span>
                <div className="material-symbols-outlined text-[#d0bcff] mb-6 text-md">auto renew</div>
                <h3 className="font-['Inter'] font-bold text-white mb-2 uppercase tracking-tight">Compounding</h3>
                <p className="text-xs text-[#cbc3d7] leading-relaxed font-['Inter']">24/7 harvest cycles to maximize mathematical return curves.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Data Visualization Section (Bento Grid) */}
        <section className="max-w-7xl mx-auto px-6 lg:px-12 py-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Large Feature */}
            <div className="md:col-span-2 bg-[#1b1b20] border border-[#494454] relative overflow-hidden h-[400px]">
              <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div 
                  className="w-full h-1 bg-gradient-to-r from-transparent via-[#d0bcff] to-transparent absolute top-0 left-0 opacity-20"
                />
                <div 
                  className="w-full h-full opacity-10"
                  style={{
                    backgroundImage: 'radial-gradient(circle at 50% 50%, #d0bcff 0%, transparent 60%)'
                  }}
                />
              </div>
              <div className="relative z-10 p-10 h-full flex flex-col">
                <div className="mb-auto">
                  <span className="font-['JetBrains_Mono'] text-[10px] uppercase text-[#d0bcff] tracking-[0.2em]">Visual Intelligence</span>
                  <h2 className="text-4xl font-black text-white mt-4 font-['Inter'] uppercase leading-none">Real-Time Terminal Interface</h2>
                </div>
                <div className="flex items-center gap-12">
                  <div className="flex flex-col">
                    <span className="font-['JetBrains_Mono'] text-[40px] text-white font-bold leading-none">1.2M+</span>
                    <span className="font-['JetBrains_Mono'] text-[10px] text-[#958ea0] uppercase mt-2">Daily Computations</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-['JetBrains_Mono'] text-[40px] text-white font-bold leading-none">99.9%</span>
                    <span className="font-['JetBrains_Mono'] text-[10px] text-[#958ea0] uppercase mt-2">Execution Uptime</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Side Features */}
            <div className="bg-[#35343a] p-8 border border-[#494454] flex flex-col justify-between">
              <div className="material-symbols-outlined text-[#4edea3] text-4xl mb-4">shield</div>
              <div>
                <h3 className="font-['Inter'] font-bold text-white mb-3 uppercase tracking-tight">Formal Verification</h3>
                <p className="text-sm text-[#cbc3d7] leading-relaxed">Every logic path is mathematically proven before protocol deployment.</p>
              </div>
            </div>
            
            <div className="bg-[#d0bcff] p-8 border border-[#494454] flex flex-col justify-between">
              <div className="material-symbols-outlined text-[#3c0091] text-4xl mb-4">bolt</div>
              <div>
                <h3 className="font-['Inter'] font-bold text-[#3c0091] mb-3 uppercase tracking-tight">Flash Execution</h3>
                <p className="text-sm text-[#340080] leading-relaxed">Sub-millisecond trade routing through private RPC networks.</p>
              </div>
            </div>
            
            <div className="md:col-span-2 bg-[#16161F] p-8 border border-[#494454] flex items-center justify-between">
              <div className="max-w-md">
                <h3 className="font-['Inter'] font-bold text-white mb-2 uppercase tracking-tight">Institutional Scalability</h3>
                <p className="text-sm text-[#cbc3d7]">Deploy custom instances for treasury management or DAO-level yield strategies with multi-sig security layers.</p>
              </div>
              <button className="material-symbols-outlined text-[#d0bcff] text-3xl">arrow_forward</button>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="max-w-7xl mx-auto px-6 lg:px-12 py-32 text-center">
          <div className="border-t border-[#494454] pt-32">
            <h2 className="text-4xl md:text-6xl font-black text-white mb-8 font-['Inter'] uppercase">Initialize Your Vault</h2>
            <p className="font-['JetBrains_Mono'] text-[#958ea0] uppercase tracking-widest text-sm mb-12">No account required. Connect and deploy.</p>
            <div className="inline-flex flex-col md:flex-row gap-6">
              <button className="border border-[#958ea0] px-12 py-6 font-['JetBrains_Mono'] text-sm uppercase tracking-widest text-[#e4e1e9] hover:bg-[#1f1f24]">Request API Access</button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer Shell */}
      <footer className="bg-[#0F0F14] border-t border-[#262631] py-12">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="text-white font-bold font-['Inter'] uppercase tracking-tighter text-xl">VEKTOR KINETICS</div>
            <p className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-wider text-gray-500">© 2024 VEKTOR KINETICS. ALL RIGHTS RESERVED.</p>
          </div>
          <div className="flex gap-8">
            <a className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-wider text-gray-600 hover:text-[#d0bcff] transition-colors" href="#">Security Audit</a>
            <a className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-wider text-gray-600 hover:text-[#d0bcff] transition-colors" href="#">Terms of Service</a>
            <a className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-wider text-gray-600 hover:text-[#d0bcff] transition-colors" href="#">Protocol Status</a>
          </div>
          <div className="flex gap-4">
            <span className="material-symbols-outlined text-gray-500 hover:text-white cursor-pointer">share</span>
            <span className="material-symbols-outlined text-gray-500 hover:text-white cursor-pointer">terminal</span>
          </div>
        </div>
      </footer>
    </div>
  );
}