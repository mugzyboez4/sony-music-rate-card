import React, { useState, useEffect } from 'react';
import { Calculator, Music, TrendingUp, DollarSign, Info, SplitSquareHorizontal, X, Save, FolderOpen, Trash2, FileDown, Percent, Menu, Flame, Search, Loader2, CheckCircle2, Globe } from 'lucide-react';
import { generatePDF } from '../lib/pdfGenerator';
import BudgetCalculator from './BudgetCalculator';
import TerritorySelector from './TerritorySelector';
import { trpc } from '../lib/trpc';
import { calculateTerritoryPercentage, getTerritoryDisplayName } from '../../../shared/territories';

// Types
type ArtistTier = 'Developing' | 'Breaking' | 'Established' | 'Superstar' | 'Legacy';
type CampaignType = 'Organic' | 'Paid';

interface PricingState {
  artistTier: ArtistTier;
  campaignType: CampaignType;
  duration: number; // in weeks
  billboardHot100: boolean;
  brandFollowerCount: number; // in millions - Brand partner followers
  artistFollowerCount: number; // in millions - Artist followers
  brandName: string; // Brand name for lookup
  artistName: string; // Artist name for lookup
  trackVolume: number; // Number of tracks licensed
  isViral: boolean; // Virality Discount
  selectedTerritories: string[]; // Territory IDs for regional pricing
}

interface Breakdown {
  combinedFollowers: number;
  followerBaseRate: number;
  artistBaseRate: number;
  totalBaseRate: number;
  rateWithBillboard: number;
  weeklyRate: number;
  grossPrice: number;
  volumeDiscountPercent: number;
  viralityDiscountPercent: number;
  totalDiscountAmount: number;
  territoryPercentage: number; // Territory multiplier (0-100%)
  territoryAdjustedPrice: number; // Price after territory adjustment
  finalPrice: number;
}

interface SavedScenario {
  id: string;
  name: string;
  date: number;
  isCompareMode: boolean;
  scenarioA: PricingState;
  scenarioB: PricingState;
}

// Constants & Rates
const FOLLOWER_BASE_RATES = [
  { max: 4.999999, fee: 12000 },
  { max: 24.999999, fee: 15000 },
  { max: 49.999999, fee: 25000 },
  { max: 99.999999, fee: 37500 },
  { max: 249.999999, fee: 45000 },
  { max: 499.999999, fee: 60000 },
  { max: Infinity, fee: 75000 },
];

const ARTIST_TIER_BASE_RATES: Record<ArtistTier, number> = {
  'Developing': 25000,
  'Breaking': 31250,
  'Established': 43750,
  'Superstar': 87500,
  'Legacy': 175000,
};

const ARTIST_MULTIPLIERS: Record<ArtistTier, number> = {
  'Developing': 1.0,
  'Breaking': 1.25,
  'Established': 1.75,
  'Superstar': 2.0,
  'Legacy': 3.0,
};

const DEFAULT_STATE: PricingState = {
  artistTier: 'Developing',
  campaignType: 'Organic',
  duration: 4,
  billboardHot100: false,
  brandFollowerCount: 0,
  artistFollowerCount: 0,
  brandName: '',
  artistName: '',
  trackVolume: 1,
  isViral: false,
  selectedTerritories: ['worldwide'], // Default to worldwide
};

export default function PricingCalculator() {
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [scenarioA, setScenarioA] = useState<PricingState>(DEFAULT_STATE);
  const [scenarioB, setScenarioB] = useState<PricingState>({ ...DEFAULT_STATE, artistTier: 'Established' });
  
  // Save/Load State
  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>([]);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
  const [newScenarioName, setNewScenarioName] = useState('');

  // Budget Calculator State
  const [isBudgetCalculatorOpen, setIsBudgetCalculatorOpen] = useState(false);

  // Mobile Menu State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Verification UI State
  const [verificationUrl, setVerificationUrl] = useState('');
  const [verificationMessage, setVerificationMessage] = useState('');
  const [velocityPercent, setVelocityPercent] = useState(0);
  const verifyTrendMutation = trpc.trend.verify.useMutation();

  // Follower Lookup State
  const [brandLookupLoading, setBrandLookupLoading] = useState(false);
  const [artistLookupLoading, setArtistLookupLoading] = useState(false);
  const [brandLookupMessage, setBrandLookupMessage] = useState('');
  const [artistLookupMessage, setArtistLookupMessage] = useState('');
  const followerLookupMutation = trpc.followers.lookup.useMutation();

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('sony_music_rate_card_scenarios');
    if (saved) {
      try {
        setSavedScenarios(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved scenarios', e);
      }
    }
  }, []);

  const saveScenario = () => {
    if (!newScenarioName.trim()) return;
    
    const newScenario: SavedScenario = {
      id: Date.now().toString(),
      name: newScenarioName,
      date: Date.now(),
      isCompareMode,
      scenarioA,
      scenarioB
    };

    const updated = [newScenario, ...savedScenarios];
    setSavedScenarios(updated);
    localStorage.setItem('sony_music_rate_card_scenarios', JSON.stringify(updated));
    setNewScenarioName('');
    setIsSaveModalOpen(false);
  };

  const loadScenario = (scenario: SavedScenario) => {
    setIsCompareMode(scenario.isCompareMode);
    setScenarioA(scenario.scenarioA);
    setScenarioB(scenario.scenarioB);
    setIsLoadModalOpen(false);
  };

  const deleteScenario = (id: string) => {
    const updated = savedScenarios.filter(s => s.id !== id);
    setSavedScenarios(updated);
    localStorage.setItem('sony_music_rate_card_scenarios', JSON.stringify(updated));
  };

  const calculateBreakdown = (state: PricingState): Breakdown => {
    // 1. Combined Followers
    const combinedFollowers = state.brandFollowerCount + state.artistFollowerCount;

    // 2. Follower Base Rate
    const followerRateObj = FOLLOWER_BASE_RATES.find(r => combinedFollowers <= r.max) || FOLLOWER_BASE_RATES[FOLLOWER_BASE_RATES.length - 1];
    const followerBaseRate = followerRateObj.fee;

    // 3. Artist Tier Base Rate
    const artistTierRate = ARTIST_TIER_BASE_RATES[state.artistTier];

    // 4. Total Base Rate
    const totalBaseRate = followerBaseRate + artistTierRate;

    // 5. Billboard Multiplier
    const billboardMultiplier = state.billboardHot100 ? 1.2 : 1.0;
    const rateWithBillboard = totalBaseRate * billboardMultiplier;

    // 6. Weekly Rate (Annual / 52)
    const weeklyRate = rateWithBillboard / 52;

    // 7. Gross Price (Before Discounts)
    const multiplier = state.campaignType === 'Organic' ? 1.0 : ARTIST_MULTIPLIERS[state.artistTier];
    const grossPrice = weeklyRate * multiplier * state.duration;

    // 8. Calculate Discounts
    let volumeDiscountPercent = 0;
    if (state.trackVolume >= 10) volumeDiscountPercent = 0.35;
    else if (state.trackVolume >= 5) volumeDiscountPercent = 0.25;
    else if (state.trackVolume >= 3) volumeDiscountPercent = 0.15;

    const viralityDiscountPercent = state.isViral ? 0.15 : 0;

    const totalDiscountPercent = volumeDiscountPercent + viralityDiscountPercent;
    const totalDiscountAmount = grossPrice * totalDiscountPercent;
    const priceAfterDiscounts = grossPrice - totalDiscountAmount;

    // 9. Territory Adjustment
    const territoryPercentage = calculateTerritoryPercentage(state.selectedTerritories);
    const territoryMultiplier = territoryPercentage / 100;
    const territoryAdjustedPrice = priceAfterDiscounts * territoryMultiplier;
    const finalPrice = territoryAdjustedPrice;

    return {
      combinedFollowers,
      followerBaseRate,
      artistBaseRate: artistTierRate,
      totalBaseRate,
      rateWithBillboard,
      weeklyRate,
      grossPrice,
      volumeDiscountPercent,
      viralityDiscountPercent,
      totalDiscountAmount,
      territoryPercentage,
      territoryAdjustedPrice,
      finalPrice,
    };
  };

  const breakdownA = calculateBreakdown(scenarioA);
  const breakdownB = calculateBreakdown(scenarioB);

  const handleExportPDF = () => {
    const scenarios = [
      { title: isCompareMode ? 'Scenario A' : 'Current Scenario', state: scenarioA, breakdown: breakdownA }
    ];

    if (isCompareMode) {
      scenarios.push({ title: 'Scenario B', state: scenarioB, breakdown: breakdownB });
    }

    generatePDF(scenarios, isCompareMode);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  };

  const handleVerifyTrend = async (setState: (s: PricingState) => void, currentState: PricingState) => {
    if (!verificationUrl) return;
    
    try {
      const result = await verifyTrendMutation.mutateAsync({ trackUrl: verificationUrl });
      
      if (result.success && result.isViral) {
        setState({ ...currentState, isViral: true });
        setVerificationMessage(result.data.message);
        setVelocityPercent(result.data.velocityPercent);
      } else {
        setVerificationMessage(result.data.message);
        setVelocityPercent(result.data.velocityPercent);
      }
    } catch (error) {
      console.error('Verification failed:', error);
      setVerificationMessage('Failed to verify track. Please try again.');
    }
  };

  const handleBrandLookup = async (setState: (s: PricingState) => void, currentState: PricingState) => {
    if (!currentState.brandName) return;
    
    setBrandLookupLoading(true);
    setBrandLookupMessage('');
    
    try {
      const result = await followerLookupMutation.mutateAsync({ name: currentState.brandName });
      
      if (result.success) {
        setState({ ...currentState, brandFollowerCount: result.followers });
        setBrandLookupMessage(`✓ Found ${result.followers}M followers on ${result.platform}`);
      } else {
        setBrandLookupMessage(result.error || 'Lookup failed');
      }
    } catch (error) {
      console.error('Brand lookup failed:', error);
      setBrandLookupMessage('Failed to lookup followers. Please enter manually.');
    } finally {
      setBrandLookupLoading(false);
    }
  };

  const handleArtistLookup = async (setState: (s: PricingState) => void, currentState: PricingState) => {
    if (!currentState.artistName) return;
    
    setArtistLookupLoading(true);
    setArtistLookupMessage('');
    
    try {
      const result = await followerLookupMutation.mutateAsync({ name: currentState.artistName });
      
      if (result.success) {
        setState({ ...currentState, artistFollowerCount: result.followers });
        setArtistLookupMessage(`✓ Found ${result.followers}M followers on ${result.platform}`);
      } else {
        setArtistLookupMessage(result.error || 'Lookup failed');
      }
    } catch (error) {
      console.error('Artist lookup failed:', error);
      setArtistLookupMessage('Failed to lookup followers. Please enter manually.');
    } finally {
      setArtistLookupLoading(false);
    }
  };

  const ScenarioColumn = ({ 
    title, 
    state, 
    setState, 
    breakdown, 
    color 
  }: { 
    title: string, 
    state: PricingState, 
    setState: (s: PricingState) => void, 
    breakdown: Breakdown,
    color: string
  }) => (
    <div className="space-y-6 md:space-y-8">
      {/* Header */}
      <div className={`bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] px-4 py-3 md:px-6 md:py-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-2`}>
        <h2 className="text-xl md:text-2xl font-black uppercase">{title}</h2>
        <div className="text-right flex md:block justify-between items-center w-full md:w-auto">
          {breakdown.totalDiscountAmount > 0 && (
            <div className="text-xs font-bold text-gray-500 line-through decoration-2 decoration-red-500 mr-2 md:mr-0">
              {formatCurrency(breakdown.grossPrice)}
            </div>
          )}
          <div className={`px-3 py-1 rounded-lg font-bold text-white text-sm ${color === 'green' ? 'bg-[#58CC02]' : 'bg-[#CE82FF]'}`}>
            {formatCurrency(breakdown.finalPrice)}
          </div>
        </div>
      </div>

      {/* Artist Tier Card */}
      <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-2xl p-4 md:p-6">
        <div className="flex items-center gap-3 mb-4 md:mb-6">
          <div className="bg-[#FFC800] p-2 border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <TrendingUp className="w-5 h-5" />
          </div>
          <h3 className="text-lg md:text-xl font-black uppercase">Artist Tier</h3>
        </div>
        
        <div className="grid grid-cols-1 gap-2 md:gap-3">
          {(Object.keys(ARTIST_TIER_BASE_RATES) as ArtistTier[]).map((tier) => (
            <button
              key={tier}
              onClick={() => setState({ ...state, artistTier: tier })}
              className={`
                relative px-3 py-2 md:px-4 md:py-3 border-4 border-black rounded-xl font-bold text-sm text-left transition-all
                ${state.artistTier === tier 
                  ? `${color === 'green' ? 'bg-[#58CC02]' : 'bg-[#CE82FF]'} text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-[2px] translate-y-[2px]` 
                  : 'bg-white hover:bg-gray-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5'}
              `}
            >
              {tier}
            </button>
          ))}
        </div>
      </div>

      {/* Campaign Details Card */}
      <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-2xl p-4 md:p-6">
        <div className="flex items-center gap-3 mb-4 md:mb-6">
          <div className="bg-[#1CB0F6] p-2 border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <Calculator className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg md:text-xl font-black uppercase">Details</h3>
        </div>

        <div className="space-y-6">
          {/* Campaign Type */}
          <div>
            <label className="block text-sm font-bold mb-2">Type</label>
            <div className="flex gap-2">
              {(['Organic', 'Paid'] as CampaignType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setState({ ...state, campaignType: type })}
                  className={`
                    flex-1 px-3 py-2 border-4 border-black rounded-xl font-bold text-sm transition-all
                    ${state.campaignType === type
                      ? `${color === 'green' ? 'bg-[#58CC02]' : 'bg-[#CE82FF]'} text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] translate-x-[1px] translate-y-[1px]`
                      : 'bg-white hover:bg-gray-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'}
                  `}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Duration Slider */}
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-bold">Duration</label>
              <span className="text-sm font-bold text-gray-500">{state.duration} weeks</span>
            </div>
            <input
              type="range"
              min="1"
              max="52"
              value={state.duration}
              onChange={(e) => setState({ ...state, duration: Number(e.target.value) })}
              className="w-full h-4 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black border-2 border-black"
            />
          </div>

          {/* Track Volume Slider */}
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-bold">Track Volume</label>
              <span className="text-sm font-bold text-gray-500">{state.trackVolume} tracks</span>
            </div>
            <input
              type="range"
              min="1"
              max="20"
              value={state.trackVolume}
              onChange={(e) => setState({ ...state, trackVolume: Number(e.target.value) })}
              className="w-full h-4 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black border-2 border-black"
            />
            <div className="mt-2 flex justify-between text-xs font-bold text-gray-400">
              <span>1</span>
              <span className={state.trackVolume >= 3 ? 'text-[#58CC02]' : ''}>3 (15%)</span>
              <span className={state.trackVolume >= 5 ? 'text-[#58CC02]' : ''}>5 (25%)</span>
              <span className={state.trackVolume >= 10 ? 'text-[#58CC02]' : ''}>10 (35%)</span>
              <span>20</span>
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-3 pt-4 border-t-2 border-gray-100">
            <label className="flex items-center justify-between cursor-pointer group">
              <span className="text-sm font-bold">Billboard Hot 100</span>
              <div 
                onClick={() => setState({ ...state, billboardHot100: !state.billboardHot100 })}
                className={`w-14 h-8 rounded-full border-4 border-black relative transition-colors ${state.billboardHot100 ? 'bg-[#58CC02]' : 'bg-gray-200'}`}
              >
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white border-2 border-black rounded-full transition-transform ${state.billboardHot100 ? 'translate-x-6' : 'translate-x-0'}`} />
              </div>
            </label>

            {/* Virality Discount Section */}
            <div className="space-y-2">
              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-sm font-bold flex items-center gap-2">
                  Virality Discount
                  <span className="bg-[#FF4B4B] text-white text-[10px] px-1.5 py-0.5 rounded border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1">
                    <Flame className="w-3 h-3" fill="currentColor" /> -15%
                  </span>
                </span>
                <div 
                  onClick={() => setState({ ...state, isViral: !state.isViral })}
                  className={`w-14 h-8 rounded-full border-4 border-black relative transition-colors ${state.isViral ? 'bg-[#FF4B4B]' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white border-2 border-black rounded-full transition-transform ${state.isViral ? 'translate-x-6' : 'translate-x-0'}`} />
                </div>
              </label>

              {/* Verification UI Mock-up */}
              {!state.isViral && (
                <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-3 mt-2">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input 
                        type="text" 
                        placeholder="Paste Track URL / ISRC to Verify" 
                        className="w-full pl-9 pr-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:border-black transition-colors"
                        value={verificationUrl}
                        onChange={(e) => setVerificationUrl(e.target.value)}
                      />
                    </div>
                    <button 
                      onClick={() => handleVerifyTrend(setState, state)}
                      disabled={!verificationUrl || verifyTrendMutation.isPending}
                      className="bg-black text-white px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {verifyTrendMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Verify'}
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2 font-medium">
                    *Checks backend API for track velocity. Add Chartmetric API key to enable live data.
                  </p>
                </div>
              )}

              {state.isViral && verificationMessage && (
                <div className="bg-[#FF4B4B]/10 border-2 border-[#FF4B4B] rounded-xl p-3 mt-2 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                  <CheckCircle2 className="w-5 h-5 text-[#FF4B4B] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-[#FF4B4B] uppercase">Verified Trending</p>
                    <p className="text-[10px] text-gray-600 font-medium mt-0.5">
                      {verificationMessage}
                    </p>
                  </div>
                </div>
              )}
              
              {!state.isViral && verificationMessage && (
                <div className="bg-gray-100 border-2 border-gray-300 rounded-xl p-3 mt-2 flex items-start gap-3">
                  <Info className="w-5 h-5 text-gray-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-gray-700 uppercase">Not Trending</p>
                    <p className="text-[10px] text-gray-600 font-medium mt-0.5">
                      {verificationMessage}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Brand Partner Followers */}
          <div className="pt-4 border-t-2 border-gray-100">
            <label className="block text-sm font-bold mb-2 text-gray-500">Brand Partner Name</label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                placeholder="e.g., Nike, Coca-Cola"
                value={state.brandName}
                onChange={(e) => setState({ ...state, brandName: e.target.value })}
                className="flex-1 px-3 py-2 border-4 border-black rounded-xl font-bold focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
              />
              <button
                onClick={() => handleBrandLookup(setState, state)}
                disabled={!state.brandName || brandLookupLoading}
                className="bg-[#58CC02] text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                {brandLookupLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
                {brandLookupLoading ? 'Looking up...' : 'Lookup'}
              </button>
            </div>
            {brandLookupMessage && (
              <p className={`text-xs font-medium mb-3 ${brandLookupMessage.startsWith('✓') ? 'text-[#58CC02]' : 'text-gray-500'}`}>
                {brandLookupMessage}
              </p>
            )}
            <label className="block text-sm font-bold mb-2 text-gray-500">Brand Followers (Millions)</label>
            <input
              type="number"
              min="0"
              step="0.1"
              placeholder="0.0"
              value={state.brandFollowerCount || ''}
              onChange={(e) => setState({ ...state, brandFollowerCount: Number(e.target.value) || 0 })}
              className="w-full px-3 py-2 border-4 border-black rounded-xl font-bold focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
            />
          </div>

          {/* Artist Followers */}
          <div className="pt-4 border-t-2 border-gray-100">
            <label className="block text-sm font-bold mb-2 text-gray-500">Artist Name</label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                placeholder="e.g., Taylor Swift, Drake"
                value={state.artistName}
                onChange={(e) => setState({ ...state, artistName: e.target.value })}
                className="flex-1 px-3 py-2 border-4 border-black rounded-xl font-bold focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
              />
              <button
                onClick={() => handleArtistLookup(setState, state)}
                disabled={!state.artistName || artistLookupLoading}
                className="bg-[#58CC02] text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                {artistLookupLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
                {artistLookupLoading ? 'Looking up...' : 'Lookup'}
              </button>
            </div>
            {artistLookupMessage && (
              <p className={`text-xs font-medium mb-3 ${artistLookupMessage.startsWith('✓') ? 'text-[#58CC02]' : 'text-gray-500'}`}>
                {artistLookupMessage}
              </p>
            )}
            <label className="block text-sm font-bold mb-2 text-gray-500">Artist Followers (Millions)</label>
            <input
              type="number"
              min="0"
              step="0.1"
              placeholder="0.0"
              value={state.artistFollowerCount || ''}
              onChange={(e) => setState({ ...state, artistFollowerCount: Number(e.target.value) || 0 })}
              className="w-full px-3 py-2 border-4 border-black rounded-xl font-bold focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
            />
          </div>

          {/* Territory Selection */}
          <div className="pt-4 border-t-2 border-gray-100">
            <TerritorySelector
              selectedTerritories={state.selectedTerritories}
              onChange={(territories) => setState({ ...state, selectedTerritories: territories })}
            />
          </div>
        </div>
      </div>

      {/* Price Breakdown Card */}
      <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-2xl p-4 md:p-6">
        <div className="flex items-center gap-3 mb-4 md:mb-6">
          <div className="bg-[#CE82FF] p-2 border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <DollarSign className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg md:text-xl font-black uppercase">Breakdown</h3>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="font-bold text-gray-500">Combined Reach</span>
            <span className="font-bold">{breakdown.combinedFollowers.toFixed(2)}M</span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold text-gray-500">Base Rate</span>
            <span className="font-bold">{formatCurrency(breakdown.totalBaseRate)}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold text-gray-500">Weekly Rate</span>
            <span className="font-bold">{formatCurrency(breakdown.weeklyRate)}</span>
          </div>
          
          {(breakdown.volumeDiscountPercent > 0 || breakdown.viralityDiscountPercent > 0) && (
            <div className="pt-3 mt-3 border-t-2 border-dashed border-gray-200">
              {breakdown.volumeDiscountPercent > 0 && (
                <div className="flex justify-between text-[#58CC02]">
                  <span className="font-bold">Volume Discount</span>
                  <span className="font-bold">-{breakdown.volumeDiscountPercent * 100}%</span>
                </div>
              )}
              {breakdown.viralityDiscountPercent > 0 && (
                <div className="flex justify-between text-[#FF4B4B]">
                  <span className="font-bold">Virality Discount</span>
                  <span className="font-bold">-{breakdown.viralityDiscountPercent * 100}%</span>
                </div>
              )}
              <div className="flex justify-between text-[#58CC02] mt-1">
                <span className="font-black uppercase">Total Saved</span>
                <span className="font-black">-{formatCurrency(breakdown.totalDiscountAmount)}</span>
              </div>
            </div>
          )}

          {/* Territory Adjustment */}
          {breakdown.territoryPercentage < 100 && (
            <div className="pt-3 mt-3 border-t-2 border-dashed border-gray-200">
              <div className="flex justify-between text-blue-600">
                <span className="font-bold flex items-center gap-1">
                  <Globe className="w-4 h-4" />
                  Territory ({getTerritoryDisplayName(state.selectedTerritories)})
                </span>
                <span className="font-bold">{breakdown.territoryPercentage}%</span>
              </div>
            </div>
          )}

          <div className="pt-4 mt-4 border-t-4 border-black flex justify-between items-end">
            <span className="font-black uppercase text-lg">Total</span>
            <span className={`font-black text-2xl md:text-3xl ${color === 'green' ? 'text-[#58CC02]' : 'text-[#CE82FF]'}`}>
              {formatCurrency(breakdown.finalPrice)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F7F7F7] font-sans text-black pb-20">
      {/* Navbar */}
      <nav className="bg-white border-b-4 border-black px-4 md:px-6 py-3 md:py-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="bg-[#58CC02] p-1.5 md:p-2 rounded-xl border-4 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] md:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <Music className="w-6 h-6 md:w-8 md:h-8 text-white" />
            </div>
            <div>
              <h1 className="text-lg md:text-2xl font-black uppercase tracking-tight leading-tight">Sony Music</h1>
              <p className="text-xs md:text-sm font-bold text-gray-500 hidden md:block">Standard Rate Card Calculator</p>
            </div>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex gap-3">
            <button 
              onClick={() => setIsBudgetCalculatorOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#FF9600] text-white border-4 border-black rounded-xl font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              <DollarSign className="w-4 h-4" />
              Budget Calc
            </button>
            <button 
              onClick={() => setIsLoadModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white border-4 border-black rounded-xl font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              <FolderOpen className="w-4 h-4" />
              Load
            </button>
            <button 
              onClick={() => setIsSaveModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white border-4 border-black rounded-xl font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
            <button 
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-4 py-2 bg-white border-4 border-black rounded-xl font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              <FileDown className="w-4 h-4" />
              Export PDF
            </button>
            <button 
              onClick={() => setIsCompareMode(!isCompareMode)}
              className={`
                flex items-center gap-2 px-4 py-2 border-4 border-black rounded-xl font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all
                ${isCompareMode ? 'bg-black text-white' : 'bg-white text-black'}
              `}
            >
              <SplitSquareHorizontal className="w-4 h-4" />
              Compare Mode
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 bg-white border-4 border-black rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none transition-all"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b-4 border-black p-4 shadow-xl flex flex-col gap-3 animate-in slide-in-from-top-2">
            <button 
              onClick={() => { setIsBudgetCalculatorOpen(true); setIsMobileMenuOpen(false); }}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-[#FF9600] text-white border-4 border-black rounded-xl font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none transition-all"
            >
              <DollarSign className="w-5 h-5" />
              Budget Calculator
            </button>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => { setIsLoadModalOpen(true); setIsMobileMenuOpen(false); }}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-white border-4 border-black rounded-xl font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none transition-all"
              >
                <FolderOpen className="w-5 h-5" />
                Load
              </button>
              <button 
                onClick={() => { setIsSaveModalOpen(true); setIsMobileMenuOpen(false); }}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-white border-4 border-black rounded-xl font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none transition-all"
              >
                <Save className="w-5 h-5" />
                Save
              </button>
            </div>
            <button 
              onClick={() => { handleExportPDF(); setIsMobileMenuOpen(false); }}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-white border-4 border-black rounded-xl font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none transition-all"
            >
              <FileDown className="w-5 h-5" />
              Export PDF
            </button>
            <button 
              onClick={() => { setIsCompareMode(!isCompareMode); setIsMobileMenuOpen(false); }}
              className={`
                flex items-center justify-center gap-2 px-4 py-3 border-4 border-black rounded-xl font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none transition-all
                ${isCompareMode ? 'bg-black text-white' : 'bg-white text-black'}
              `}
            >
              <SplitSquareHorizontal className="w-5 h-5" />
              {isCompareMode ? 'Exit Compare Mode' : 'Enter Compare Mode'}
            </button>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Total Banner */}
        <div className="mb-6 md:mb-8 bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] md:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-2xl p-4 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
          <div>
            <h2 className="text-xl md:text-2xl font-black uppercase">Current Scenario</h2>
            {isCompareMode && <p className="text-gray-500 font-bold text-sm md:text-base">Comparing two configurations</p>}
          </div>
          <div className="text-right w-full md:w-auto flex justify-between md:block items-center">
            <span className="md:hidden font-black uppercase text-lg">Total</span>
            <div>
              <div className="text-3xl md:text-4xl font-black text-[#58CC02]">
                {formatCurrency(breakdownA.finalPrice + (isCompareMode ? breakdownB.finalPrice : 0))}
              </div>
              {isCompareMode && <p className="text-xs md:text-sm font-bold text-gray-400 uppercase hidden md:block">Combined Total</p>}
            </div>
          </div>
        </div>

        <div className={`grid gap-6 md:gap-8 ${isCompareMode ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 max-w-3xl mx-auto'}`}>
          <ScenarioColumn 
            title={isCompareMode ? "Scenario A" : "Configuration"} 
            state={scenarioA} 
            setState={setScenarioA} 
            breakdown={breakdownA}
            color="green"
          />
          
          {isCompareMode && (
            <ScenarioColumn 
              title="Scenario B" 
              state={scenarioB} 
              setState={setScenarioB} 
              breakdown={breakdownB}
              color="purple"
            />
          )}
        </div>
      </main>

      {/* Save Modal */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-2xl w-full max-w-md p-6 animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black uppercase">Save Scenario</h3>
              <button onClick={() => setIsSaveModalOpen(false)}><X className="w-6 h-6" /></button>
            </div>
            <input
              type="text"
              placeholder="Scenario Name (e.g. 'Superstar Launch')"
              value={newScenarioName}
              onChange={(e) => setNewScenarioName(e.target.value)}
              className="w-full px-4 py-3 border-4 border-black rounded-xl font-bold mb-6 focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
              autoFocus
            />
            <div className="flex gap-3">
              <button 
                onClick={() => setIsSaveModalOpen(false)}
                className="flex-1 py-3 font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={saveScenario}
                disabled={!newScenarioName.trim()}
                className="flex-1 py-3 bg-[#58CC02] text-white border-4 border-black rounded-xl font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Load Modal */}
      {isLoadModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-2xl w-full max-w-lg p-6 max-h-[80vh] flex flex-col animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black uppercase">Load Scenario</h3>
              <button onClick={() => setIsLoadModalOpen(false)}><X className="w-6 h-6" /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {savedScenarios.length === 0 ? (
                <div className="text-center py-12 text-gray-400 font-bold">
                  No saved scenarios yet.
                </div>
              ) : (
                savedScenarios.map((scenario) => (
                  <div key={scenario.id} className="flex items-center gap-3 group">
                    <button
                      onClick={() => loadScenario(scenario)}
                      className="flex-1 text-left p-4 border-4 border-black rounded-xl hover:bg-gray-50 transition-colors flex justify-between items-center group-hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                    >
                      <div>
                        <div className="font-black uppercase">{scenario.name}</div>
                        <div className="text-xs font-bold text-gray-400 mt-1">
                          {new Date(scenario.date).toLocaleDateString()} • {scenario.isCompareMode ? 'Comparison' : 'Single View'}
                        </div>
                      </div>
                      <FolderOpen className="w-5 h-5 text-gray-400 group-hover:text-black" />
                    </button>
                    <button 
                      onClick={() => deleteScenario(scenario.id)}
                      className="p-4 border-4 border-black rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Budget Calculator Modal */}
      {isBudgetCalculatorOpen && (
        <BudgetCalculator 
          onApplyRecommendation={(state) => {
            setScenarioA(state);
            setIsCompareMode(false); // Reset to single view for clarity
            setIsBudgetCalculatorOpen(false);
          }}
          onClose={() => setIsBudgetCalculatorOpen(false)}
        />
      )}
    </div>
  );
}
