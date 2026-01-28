# Sony Music Standard Rate Card Calculator

A comprehensive pricing calculator for Sony Music licensing to brand partnerships. This tool provides dynamic pricing based on artist tiers, follower counts, campaign duration, volume discounts, and virality bonuses.

## Features

### Core Pricing Engine
- **Artist Tier Pricing**: Five tiers from Developing to Legacy artists
- **Follower-Based Rates**: Dynamic pricing based on brand partner social reach
- **Campaign Types**: Organic and Paid amplification options
- **Duration Flexibility**: Weekly rate calculations for any campaign length
- **Billboard Hot 100 Bonus**: 1.2x multiplier for chart-topping tracks

### Advanced Discounts
- **Volume Discounts**: 
  - 3+ tracks: 15% off
  - 5+ tracks: 25% off
  - 10+ tracks: 35% off
- **Virality Discount**: 15% off for trending tracks (with backend verification)

### Professional Tools
- **Budget Reverse-Calculator**: Find optimal packages within budget constraints
  - Max Volume: Maximize number of tracks
  - Max Impact: Highest tier artist within budget
  - Max Duration: Longest campaign possible
- **Compare Mode**: Side-by-side scenario comparison
- **Save/Load Scenarios**: Persistent scenario management
- **PDF Export**: Professional quote generation with detailed breakdowns

## Technology Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: TailwindCSS 4 with Neo-Brutalist design
- **Backend**: Express + tRPC
- **Database**: MySQL/TiDB with Drizzle ORM
- **PDF Generation**: jsPDF with autotable
- **State Management**: React Query + tRPC

## Getting Started

### Prerequisites
- Node.js 22+
- pnpm 10+
- MySQL database (optional, for trend verification)

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database (optional)
DATABASE_URL=mysql://user:password@host:port/database

# OAuth (optional)
OAUTH_SERVER_URL=https://your-oauth-server.com

# Chartmetric API (optional, for virality verification)
CHARTMETRIC_API_KEY=your_api_key_here
```

## Usage

### Basic Pricing Calculation

1. **Select Artist Tier**: Choose from Developing, Breaking, Established, Superstar, or Legacy
2. **Choose Campaign Type**: Organic (standard rate) or Paid (multiplied rate)
3. **Set Duration**: Use slider to select campaign length in weeks
4. **Adjust Track Volume**: Select number of tracks to unlock volume discounts
5. **Add Modifiers**: Toggle Billboard Hot 100 or Virality Discount
6. **Input Brand Reach**: Add brand partner's social media followers (in millions)

### Budget Calculator

1. Click "Budget Calc" in the navigation
2. Enter your total budget
3. Click "Find Best Packages"
4. Review three optimized recommendations
5. Click "Load Package" to apply to main calculator

### Compare Mode

1. Click "Compare Mode" in the navigation
2. Configure Scenario A and Scenario B independently
3. View combined total and side-by-side breakdowns
4. Export comparison as PDF

### Save/Load Scenarios

- **Save**: Click "Save" button, enter scenario name
- **Load**: Click "Load" button, select from saved scenarios
- **Delete**: Click trash icon next to saved scenario

## Pricing Logic

### Base Rate Calculation

```
Combined Followers = Brand Partner Followers + Custom Followers
Follower Base Rate = Tiered rate based on Combined Followers
Artist Base Rate = Fixed rate per artist tier
Total Base Rate = Follower Base Rate + Artist Base Rate
```

### Follower Tiers
| Followers (Millions) | Base Rate |
|---------------------|-----------|
| 0 - 4.99            | $12,000   |
| 5 - 24.99           | $15,000   |
| 25 - 49.99          | $25,000   |
| 50 - 99.99          | $37,500   |
| 100 - 249.99        | $45,000   |
| 250 - 499.99        | $60,000   |
| 500+                | $75,000   |

### Artist Tier Rates
| Tier        | Base Rate | Paid Multiplier |
|-------------|-----------|-----------------|
| Developing  | $25,000   | 1.0x            |
| Breaking    | $31,250   | 1.25x           |
| Established | $43,750   | 1.75x           |
| Superstar   | $87,500   | 2.0x            |
| Legacy      | $175,000  | 3.0x            |

### Final Price Calculation

```
Billboard Multiplier = 1.2 if Hot 100, else 1.0
Rate with Billboard = Total Base Rate × Billboard Multiplier
Weekly Rate = Rate with Billboard / 52
Campaign Multiplier = 1.0 (Organic) or Artist Tier Multiplier (Paid)
Gross Price = Weekly Rate × Campaign Multiplier × Duration

Volume Discount = 15% (3+ tracks), 25% (5+), or 35% (10+)
Virality Discount = 15% if verified viral
Total Discount = Gross Price × (Volume % + Virality %)
Final Price = Gross Price - Total Discount
```

## Design Philosophy

The calculator uses a **Neo-Brutalist Pop** design system:
- **Bold & Professional**: High contrast, thick borders, vibrant colors
- **Functional Clarity**: Large, tactile inputs and buttons
- **Data-First**: Price and breakdown as visual heroes
- **Hard Shadows**: Solid black drop shadows (no blur)
- **Instant Feedback**: Real-time price updates

## Project Structure

```
sony-music-rate-card/
├── client/               # Frontend React application
│   ├── src/
│   │   ├── components/   # React components
│   │   │   ├── PricingCalculator.tsx
│   │   │   └── BudgetCalculator.tsx
│   │   ├── lib/          # Utilities
│   │   │   └── pdfGenerator.ts
│   │   └── pages/        # Page components
├── server/               # Backend Express + tRPC
├── shared/               # Shared types and constants
├── drizzle/              # Database migrations
└── package.json
```

## API Endpoints (tRPC)

### `trend.verify`
Verify if a track is trending/viral based on Chartmetric data.

**Input:**
```typescript
{
  trackUrl: string; // Track URL or ISRC
}
```

**Output:**
```typescript
{
  success: boolean;
  isViral: boolean;
  data: {
    message: string;
    velocityPercent: number;
  }
}
```

## Development

### Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm check` - TypeScript type checking
- `pnpm format` - Format code with Prettier
- `pnpm test` - Run tests
- `pnpm db:push` - Push database schema changes

### Adding New Features

1. Update types in `shared/types.ts`
2. Add UI components in `client/src/components/`
3. Update pricing logic in `PricingCalculator.tsx`
4. Update PDF generator in `client/src/lib/pdfGenerator.ts`
5. Add backend endpoints in `server/` if needed

## Deployment

### Production Build

```bash
pnpm build
pnpm start
```

The application will be available on port 3000 by default.

### Environment Configuration

Ensure all required environment variables are set in production:
- `NODE_ENV=production`
- `DATABASE_URL` (if using database features)
- `OAUTH_SERVER_URL` (if using authentication)

## License

MIT

## Support

For questions or issues, please contact the Sony Music development team.

---

**Version**: 1.0.0  
**Last Updated**: January 2026  
**Rebranded From**: Sony Music x Duolingo Partnership Calculator
