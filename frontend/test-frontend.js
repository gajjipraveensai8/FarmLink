import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function read(relativePath) {
	return fs.readFileSync(path.join(__dirname, relativePath), "utf8");
}

function expectContains(content, snippets, context) {
	for (const snippet of snippets) {
		if (!content.includes(snippet)) {
			throw new Error(`Missing expected snippet in ${context}: ${snippet}`);
		}
	}
}

try {
	const appContent = read("src/App.jsx");
	expectContains(
		appContent,
		[
			'path="/marketplace"',
			'path="/farmer-dashboard"',
			'path="/my-orders"',
		],
		"App routes"
	);

	const discoveryContent = read("src/pages/ProductDiscovery.jsx");
	expectContains(
		discoveryContent,
		[
			"useGeolocation",
			'useProductStore',
			"<MarketplaceSearch",
			"Nearby mode active",
		],
		"Product discovery"
	);

	const productCardContent = read("src/components/ProductCard.jsx");
	expectContains(
		productCardContent,
		[
			"Harvested Today",
			"Harvested Yesterday",
			"Harvested ${diffDays} days ago",
			"getStockLabel(quantity, category)",
		],
		"Product card freshness labels"
	);

	console.log("✅ Frontend smoke checks passed");
	process.exit(0);
} catch (error) {
	console.error("❌ Frontend smoke checks failed");
	console.error(error.message);
	process.exit(1);
}
