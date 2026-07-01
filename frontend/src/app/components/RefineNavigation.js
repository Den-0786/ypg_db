"use client";

import { useResource } from "./ResourceProvider";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function RefineNavigation() {
  const { resources, currentResource, setCurrentResource } = useResource();
  const pathname = usePathname();

  const handleResourceChange = (resourceName) => {
    setCurrentResource(resourceName);
  };

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                YPG Database
              </h1>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {resources.map((resource) => (
                <Link
                  key={resource.name}
                  href={resource.path}
                  onClick={() => handleResourceChange(resource.name)}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200 ${
                    pathname === resource.path
                      ? "border-orange-500 text-orange-500 dark:text-orange-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100"
                  }`}
                >
                  <i className={`${resource.icon} mr-2`}></i>
                  {resource.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
} 