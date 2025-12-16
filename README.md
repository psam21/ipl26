# IPL 2026 Auction Command Center

A real-time, interactive dashboard for analyzing the IPL 2026 Mega Auction results. This application provides a comprehensive view of team squads, financial strategies, and SWOT analysis using a modern tech stack.

![Dashboard Preview](https://placehold.co/1200x600/18181b/ffffff?text=IPL+2026+Command+Center)

## 🚀 Features

- **League Overview**: Real-time ticker showing total league spending, overseas slot usage, and top 10 most expensive buys.
- **Bento Grid Dashboard**: Compact, responsive cards for all 10 teams displaying purse spent, squad size, and key risks (SPOF).
- **Interactive Team Drawers**: Drill down into any team to view:
  - **SWOT Analysis**: Strengths and Weaknesses parsed from expert analysis.
  - **Pitch View**: Visual representation of the "Best XI" on a cricket field, with sidebars showing squad depth (reserves).
  - **Roster Table**: Sortable list of all players with price tags and "New" player badges.
- **Visual Analytics**: Color-coded indicators for Title Probability (Green/Yellow/Red) and detailed probability breakdowns.

## 🛠️ Tech Stack

- **Framework**: [Next.js 15.4](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Language**: TypeScript 5.5
- **Icons**: Lucide React
- **Data Processing**: Custom Node.js scripts to parse raw text analysis.

## 📂 Project Structure

```
.
├── src/
│   ├── app/            # Next.js App Router pages
│   ├── components/     # React UI components (TeamCard, PitchView, etc.)
│   ├── data/           # Generated JSON data (ipl_data.json)
│   └── types/          # TypeScript definitions
├── data_source/        # Raw text files (Auction List & Team Analysis)
├── scripts/            # Data processing & scraping scripts
│   ├── scraping/       # Web scraping modules (teams, players)
│   └── seed-data.ts    # Main data generation script
└── public/             # Static assets
```

## ⚡ Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/psam21/ipl26.git
cd ipl26
```

### 2. Install dependencies
```bash
npm install
```

### 3. Seed the Data
The app uses a local JSON file generated from the raw text files in `data_source/`. Run this script to parse the text files and generate `src/data/ipl_data.json`.

```bash
npx tsx scripts/seed-data.ts
```

### 4. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the dashboard.

## 🚀 Deployment

This project is optimized for deployment on [Vercel](https://vercel.com).

1.  Push your code to a GitHub repository.
2.  Import the project into Vercel.
3.  Vercel will automatically detect Next.js and deploy.

## 📝 Data Sources

The dashboard is powered by two primary text files located in `data_source/`:
1.  `IPL 2026 Auction Complete Players List.txt`: Contains the full auction results, prices, and player types.
2.  `IPL 2026 Team Analysis.txt`: Contains expert analysis, SWOT points, and predicted Best XIs.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
