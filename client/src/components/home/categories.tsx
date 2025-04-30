import { useLocation } from "wouter";

// Category definitions with icons and labels
const categories = [
  { id: "computer-science", label: "Computer Science", icon: "computer" },
  { id: "mathematics", label: "Mathematics", icon: "functions" },
  { id: "science", label: "Science", icon: "science" },
  { id: "languages", label: "Languages", icon: "menu_book" },
  { id: "arts", label: "Arts", icon: "palette" },
  { id: "business", label: "Business", icon: "show_chart" }
];

const Categories = () => {
  const [, navigate] = useLocation();

  return (
    <section className="slide-in mb-16">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Explore by Subject</h2>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {categories.map((category) => (
          <div 
            key={category.id}
            className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-4 flex flex-col items-center text-center cursor-pointer"
            onClick={() => navigate(`/classes?category=${category.id}`)}
          >
            <span className="material-icons text-primary text-3xl mb-2">
              {category.icon}
            </span>
            <h3 className="font-medium">{category.label}</h3>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Categories;
