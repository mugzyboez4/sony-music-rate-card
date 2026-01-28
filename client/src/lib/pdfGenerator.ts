import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Types (replicated from PricingCalculator to avoid circular deps if not exported)
type ArtistTier = 'Developing' | 'Breaking' | 'Established' | 'Superstar' | 'Legacy';
type CampaignType = 'Organic' | 'Paid';

interface PricingState {
  artistTier: ArtistTier;
  campaignType: CampaignType;
  duration: number;
  billboardHot100: boolean;
  customFollowerCount: number;
}

interface Breakdown {
  combinedFollowers: number;
  followerBaseRate: number;
  artistBaseRate: number;
  totalBaseRate: number;
  rateWithBillboard: number;
  weeklyRate: number;
  finalPrice: number;
}

interface ScenarioData {
  title: string;
  state: PricingState;
  breakdown: Breakdown;
}

export const generatePDF = (scenarios: ScenarioData[], isCompareMode: boolean) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  
  // --- Header ---
  // Green Header Bar
  doc.setFillColor(88, 204, 2); // #58CC02
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('SONY MUSIC', 20, 20);
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('Standard Rate Card Quote', 20, 30);
  
  // Date
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - 20, 30, { align: 'right' });

  let yPos = 50;

  // --- Scenarios ---
  scenarios.forEach((scenario, index) => {
    // If compare mode and second scenario, move to right side or new section
    // For simplicity in PDF, we'll stack them but label clearly
    
    if (index > 0) {
      yPos += 10;
      doc.setDrawColor(200, 200, 200);
      doc.line(20, yPos, pageWidth - 20, yPos);
      yPos += 15;
    }

    // Scenario Title
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(scenario.title, 20, yPos);
    
    // Final Price Tag
    doc.setFillColor(index === 0 ? 88 : 206, index === 0 ? 204 : 130, index === 0 ? 2 : 255); // Green or Purple
    doc.roundedRect(pageWidth - 70, yPos - 8, 50, 12, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text(
      new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(scenario.breakdown.finalPrice),
      pageWidth - 45,
      yPos,
      { align: 'center' }
    );

    yPos += 15;

    // Details Table
    const tableData = [
      ['Artist Tier', scenario.state.artistTier],
      ['Campaign Type', scenario.state.campaignType],
      ['Duration', `${scenario.state.duration} Weeks`],
      ['Brand Partner Followers', `${scenario.state.customFollowerCount}M`],
      ['Billboard Hot 100', scenario.state.billboardHot100 ? 'Yes (1.2x Boost)' : 'No'],
    ];

    autoTable(doc, {
      startY: yPos,
      head: [['Parameter', 'Value']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [0, 0, 0] },
      styles: { fontSize: 10 },
      margin: { left: 20, right: 110 }, // Leave room for breakdown on right
      tableWidth: 80
    });

    // Breakdown Table (Right Side)
    const breakdownData = [
      ['Follower Base', new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(scenario.breakdown.followerBaseRate)],
      ['Artist Base', new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(scenario.breakdown.artistBaseRate)],
      ['Total Base', new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(scenario.breakdown.totalBaseRate)],
      ['Weekly Rate', new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(scenario.breakdown.weeklyRate)],
    ];

    autoTable(doc, {
      startY: yPos,
      head: [['Breakdown Item', 'Amount']],
      body: breakdownData,
      theme: 'grid',
      headStyles: { fillColor: index === 0 ? [88, 204, 2] : [206, 130, 255] },
      styles: { fontSize: 10 },
      margin: { left: 110, right: 20 },
      tableWidth: 80
    });

    yPos = (doc as any).lastAutoTable.finalY + 20;
  });

  // --- Footer ---
  const footerY = doc.internal.pageSize.height - 30;
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(
    'DISCLAIMER: This document is for estimation purposes only. Final pricing is subject to artist availability, specific campaign requirements, and contract negotiation. All figures are estimates based on current rate card logic.',
    20,
    footerY,
    { maxWidth: pageWidth - 40 }
  );

  // Save
  doc.save('Sony_Music_Rate_Card_Quote.pdf');
};
