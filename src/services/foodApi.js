import axios from "axios";

const API_KEY = "1MyIk6FBUNeaviNAQ9Q3Vucou0dkNf7NHTLUVBHs";
const BASE_URL = "https://api.nal.usda.gov/fdc/v1/foods/search";

export const searchFoods = async (query) => {
  // Comprehensive validation
  if (!query) {
    console.log("searchFoods: No query provided");
    return [];
  }

  // Trim whitespace and convert to string
  const cleanQuery = String(query).trim();

  // Check if query is empty or too short after trimming
  if (!cleanQuery || cleanQuery.length < 2) {
    console.log("searchFoods: Query too short or empty:", cleanQuery);
    return [];
  }

  // Check if query contains only whitespace or special characters
  if (!/[a-zA-Z0-9]/.test(cleanQuery)) {
    console.log("searchFoods: Query contains no valid characters:", cleanQuery);
    return [];
  }

  try {
    console.log("searchFoods: Searching for:", cleanQuery);

    const response = await axios.get(BASE_URL, {
      params: {
        api_key: API_KEY,
        query: cleanQuery,
        pageSize: 10,
        // Remove dataType parameter or use comma-separated string format
      },
      timeout: 10000, // 10 second timeout
    });

    const foods = response.data.foods || [];

    console.log("searchFoods: Found", foods.length, "results");

    if (foods.length === 0) {
      console.log("searchFoods: No results found for:", cleanQuery);
      return [];
    }

    // Log first result to see structure
    if (foods.length > 0) {
      console.log("searchFoods: First result sample:", {
        description: foods[0].description,
        nutrientCount: foods[0].foodNutrients?.length || 0,
      });
    }

    const results = foods.map((item) => {
      const nutrients = item.foodNutrients || [];

      // Helper function to find nutrient by name
      const getNutrient = (names) => {
        for (const name of names) {
          const nutrient = nutrients.find((n) =>
            n.nutrientName?.toLowerCase().includes(name.toLowerCase())
          );
          if (nutrient && nutrient.value) {
            return Math.round(nutrient.value);
          }
        }
        return 0;
      };

      return {
        name: item.description || "Unknown food",
        calories: getNutrient(["Energy", "Calories"]),
        protein: getNutrient(["Protein"]),
        carbs: getNutrient(["Carbohydrate", "Total carbohydrate"]),
        fat: getNutrient(["Total lipid", "Fat, total"]),
      };
    });

    console.log("searchFoods: Returning", results.length, "formatted results");
    return results;
  } catch (error) {
    if (error.response) {
      // Server responded with error status
      console.error("searchFoods API Error:", {
        status: error.response.status,
        data: error.response.data,
        query: cleanQuery,
      });
    } else if (error.request) {
      // Request made but no response
      console.error("searchFoods Network Error: No response received");
    } else {
      // Something else happened
      console.error("searchFoods Error:", error.message);
    }
    return [];
  }
};
