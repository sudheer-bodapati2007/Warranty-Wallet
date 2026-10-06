import React from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, PackageSearch } from 'lucide-react';

const EmptyState = ({
  icon: Icon = PackageSearch,
  title = "No warranties found",
  description = "Get started by adding your first product to keep track of its warranty period.",
  actionText = "Add Warranty",
  actionLink = "/add",
  onActionClick
}) => {
  return (
    <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 sm:p-12 text-center flex flex-col items-center justify-center max-w-lg mx-auto">
      <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 shadow-xs">
        <Icon className="w-8 h-8 stroke-[1.5]" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-1">{title}</h3>
      <p className="text-slate-500 text-sm max-w-sm mb-6 leading-relaxed">
        {description}
      </p>

      {actionText && (
        actionLink ? (
          <Link
            to={actionLink}
            className="inline-flex items-center space-x-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-sm shadow-blue-600/20 transition-all focus:outline-none"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{actionText}</span>
          </Link>
        ) : (
          <button
            onClick={onActionClick}
            className="inline-flex items-center space-x-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-sm shadow-blue-600/20 transition-all focus:outline-none"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{actionText}</span>
          </button>
        )
      )}
    </div>
  );
};

export default EmptyState;
