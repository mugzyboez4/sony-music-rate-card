import React, { useState } from 'react';
import { DollarSign, Check, ArrowRight, TrendingUp, Music, Clock, X } from 'lucide-react';

// Types (mirrored from PricingCalculator)
type ArtistTier = 'Developing' | 'Breaking' | 'Established' | 'Superstar' | 'Legacy';
type CampaignType = 'Organic' | 'Paid';

interface PricingState {
  artistTier: ArtistTier;
  campaignType: CampaignType;
  duration: number; // in weeks
  billboardHot100: boolean;
  customFollowerCount: number; // in millions
  trackVolume: number; // New: Number of tracks licensed
  isViral: boolean; // New: Virality Discount
}

interface Recommendation {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  state: PricingState;
  price: number;
  savings: number;
}

// Constants (mirrored from PricingCalculator)
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

const BRAND_PARTNER_FOLLOWERS = 0; // Millions - Base rate for standard licensing

export default function BudgetCalculator({ onApplyRecommendation, onClose }: { onApplyRecommendation: (state: PricingState) => void, onClose: () => void }) {
  const [budget, setBudget] = useState<number>(100000);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  const calculatePrice = (state: PricingState): { finalPrice: number, totalDiscountAmount: number } => {
    // 1. Combined Followers
    const combinedFollowers = BRAND_PARTNER_FOLLOWERS + state.customFollowerCount;

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
    const finalPrice = grossPrice - totalDiscountAmount;

    return { finalPrice, totalDiscountAmount };
  };

  const generateRecommendations = () => {
    const recs: Recommendation[] = [];

    // 1. Max Volume (Quantity Focus)
    // Try to fit as many tracks as possible with Developing artists for 4 weeks
    let maxTracks = 1;
    let bestVolumeState: PricingState | null = null;
    let bestVolumePrice = 0;
    let bestVolumeSavings = 0;

    for (let tracks = 1; tracks <= 20; tracks++) {
      const state: PricingState = {
        artistTier: 'Developing',
        campaignType: 'Organic',
        duration: 4,
        billboardHot100: false,
        customFollowerCount: 0,
        trackVolume: tracks,
        isViral: true // Assume viral potential for max volume
      };
      const { finalPrice, totalDiscountAmount } = calculatePrice(state);
      if (finalPrice <= budget) {
        maxTracks = tracks;
        bestVolumeState = state;
        bestVolumePrice = finalPrice;
        bestVolumeSavings = totalDiscountAmount;
      } else {
        break;
      }
    }

    if (bestVolumeState) {
      recs.push({
        id: 'max-volume',
        title: 'Max Volume',
        description: `${maxTracks} tracks with Developing artists for 4 weeks.`,
        icon: <Music className="w-6 h-6 text-white" />,
        state: bestVolumeState,
        price: bestVolumePrice,
        savings: bestVolumeSavings
      });
    }

    // 2. Max Impact (Quality Focus)
    // Try to find the highest tier artist for at least 4 weeks
    const tiers: ArtistTier[] = ['Legacy', 'Superstar', 'Established', 'Breaking', 'Developing'];
    let bestImpactState: PricingState | null = null;
    let bestImpactPrice = 0;
    let bestImpactSavings = 0;

    for (const tier of tiers) {
      const state: PricingState = {
        artistTier: tier,
        campaignType: 'Paid',
        duration: 4,
        billboardHot100: false,
        customFollowerCount: 0,
        trackVolume: 1,
        isViral: true // Assume viral potential for max impact
      };
      const { finalPrice, totalDiscountAmount } = calculatePrice(state);
      if (finalPrice <= budget) {
        bestImpactState = state;
        bestImpactPrice = finalPrice;
        bestImpactSavings = totalDiscountAmount;
        break; // Found the highest tier that fits
      }
    }

    if (bestImpactState) {
      recs.push({
        id: 'max-impact',
        title: 'Max Impact',
        description: `${bestImpactState.artistTier} artist with Paid amplification for 4 weeks.`,
        icon: <TrendingUp className="w-6 h-6 text-white" />,
        state: bestImpactState,
        price: bestImpactPrice,
        savings: bestImpactSavings
      });
    }

    // 3. Max Duration (Longevity Focus)
    // Try to maximize duration for an Established artist
    let maxWeeks = 4;
    let bestDurationState: PricingState | null = null;
    let bestDurationPrice = 0;
    let bestDurationSavings = 0;

    for (let weeks = 4; weeks <= 52; weeks += 4) {
      const state: PricingState = {
        artistTier: 'Established',
        campaignType: 'Organic',
        duration: weeks,
        billboardHot100: false,
        customFollowerCount: 0,
        trackVolume: 1,
        isViral: true // Assume viral potential for max duration
      };
      const { finalPrice, totalDiscountAmount } = calculatePrice(state);
      if (finalPrice <= budget) {
        maxWeeks = weeks;
        bestDurationState = state;
        bestDurationPrice = finalPrice;
        bestDurationSavings = totalDiscountAmount;
      } else {
        break;
      }
    }

    if (bestDurationState) {
      recs.push({
        id: 'max-duration',
        title: 'Max Duration',
        description: `Established artist for ${maxWeeks} weeks (Organic).`,
        icon: <Clock className="w-6 h-6 text-white" />,
        state: bestDurationState,
        price: bestDurationPrice,
        savings: bestDurationSavings
      });
    }

    setRecommendations(recs);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col animate-in zoom-in-95">
        <div className="p-4 md:p-6 border-b-4 border-black flex justify-between items-center bg-[#FFC800] sticky top-0 z-10">
          <h2 className="text-lg md:text-2xl font-black uppercase flex items-center gap-2 md:gap-3">
            <DollarSign className="w-6 h-6 md:w-8 md:h-8" />
            Budget Reverse-Calculator
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-black/10 rounded-lg transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 md:p-8 space-y-6 md:space-y-8">
          {/* Budget Input */}
          <div className="flex flex-col items-center space-y-4">
            <label className="text-lg md:text-xl font-bold uppercase text-center">What is your total budget?</label>
            <div className="relative w-full max-w-md">
              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 md:w-8 md:h-8 text-gray-400" />
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full pl-12 md:pl-14 pr-6 py-3 md:py-4 text-2xl md:text-4xl font-black border-4 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-none transition-all"
              />
            </div>
            <button
              onClick={generateRecommendations}
              className="w-full md:w-auto bg-[#58CC02] text-white px-8 py-3 rounded-xl font-black text-lg border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2"
            >
              Find Best Packages <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {/* Recommendations Grid */}
          {recommendations.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 pt-6 md:pt-8 border-t-4 border-black/10">
              {recommendations.map((rec) => (
                <div key={rec.id} className="flex flex-col h-full">
                  <div className="bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-xl p-4 md:p-6 flex-1 flex flex-col hover:-translate-y-1 transition-transform">
                    <div className={`w-12 h-12 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center mb-4 ${
                      rec.id === 'max-volume' ? 'bg-[#CE82FF]' : 
                      rec.id === 'max-impact' ? 'bg-[#FF9600]' : 'bg-[#1CB0F6]'
                    }`}>
                      {rec.icon}
                    </div>
                    
                    <h3 className="text-lg md:text-xl font-black uppercase mb-2">{rec.title}</h3>
                    <p className="text-gray-600 font-medium mb-4 md:mb-6 flex-1 text-sm md:text-base">{rec.description}</p>
                    
                    <div className="space-y-2 mb-4 md:mb-6">
                      <div className="flex justify-between items-end">
                        <span className="text-sm font-bold text-gray-400 uppercase">Price</span>
                        <span className="text-xl md:text-2xl font-black text-[#58CC02]">{formatCurrency(rec.price)}</span>
                      </div>
                      {rec.savings > 0 && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-bold text-gray-400 uppercase">Savings</span>
                          <span className="font-bold text-[#FF9600]">-{formatCurrency(rec.savings)}</span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        onApplyRecommendation(rec.state);
                        onClose();
                      }}
                      className="w-full py-3 border-4 border-black rounded-xl font-black text-sm uppercase bg-black text-white hover:bg-gray-800 transition-colors"
                    >
                      Load Package
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
