import { FileJson } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AnsoffWizardModal } from './components/AnsoffWizardModal';
import { BcgMatrixView } from './components/BcgMatrixView';
import { ExecutionOkrView } from './components/ExecutionOkrView';
import { ImportExportModal } from './components/ImportExportModal';
import { NewProductModal } from './components/NewProductModal';
import { ResourceCapsView } from './components/ResourceCapsView';
import { TopBar } from './components/TopBar';
import {
  SEED_PORTFOLIO,
  calculateProductOkrProgress,
  classifyBcgQuadrant,
  generateExecutionPlan,
} from './engine/strategyEngine';
import { clampNumber, sanitizeText } from './security/sanitizer';
import { loadPortfolio, savePortfolio } from './storage/portfolioStorage';
import {
  AnsoffStrategy,
  ProductNode,
  StrategicLever,
  WorkspaceView,
} from './types/strategy';

export default function App() {
  const [products, setProducts] = useState<ProductNode[]>(() => loadPortfolio());
  const [activeView, setActiveView] = useState<WorkspaceView>('portfolio');
  const [selectedId, setSelectedId] = useState<string>(() => loadPortfolio()[0]?.id ?? '');
  const [wizardProduct, setWizardProduct] = useState<ProductNode | null>(null);
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [ioModalOpen, setIoModalOpen] = useState(false);

  useEffect(() => {
    savePortfolio(products);
  }, [products]);

  const handleMoveProduct = (
    id: string,
    marketShare: number,
    marketGrowth: number,
    triggerWizard: boolean
  ) => {
    const nextQuad = classifyBcgQuadrant(marketShare, marketGrowth);
    let updatedNode: ProductNode | null = null;

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const quadrantChanged = p.bcgQuadrant !== nextQuad;
        updatedNode = {
          ...p,
          marketShare,
          marketGrowth,
          bcgQuadrant: nextQuad,
          ...(quadrantChanged ? { previousBcgQuadrant: p.bcgQuadrant } : {}),
          updatedAt: new Date().toISOString(),
        };
        return updatedNode;
      })
    );

    if (triggerWizard && updatedNode) {
      setWizardProduct(updatedNode);
    }
  };

  const handleUpdateProductDetails = (
    id: string,
    updates: {
      name: string;
      owner: string;
      marketShare: number;
      marketGrowth: number;
    }
  ) => {
    const cleanName = sanitizeText(updates.name, 80);
    if (!cleanName) return;
    const cleanOwner = sanitizeText(updates.owner, 60) || 'Product Lead';
    const nextShare = clampNumber(updates.marketShare, 0.1, 4.0, 1.0);
    const nextGrowth = clampNumber(updates.marketGrowth, 0, 40, 15);
    const nextQuad = classifyBcgQuadrant(nextShare, nextGrowth);

    let changedProduct: ProductNode | null = null;

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const quadrantChanged = p.bcgQuadrant !== nextQuad;
        const nextNode: ProductNode = {
          ...p,
          name: cleanName,
          owner: cleanOwner,
          marketShare: nextShare,
          marketGrowth: nextGrowth,
          bcgQuadrant: nextQuad,
          ...(quadrantChanged ? { previousBcgQuadrant: p.bcgQuadrant } : {}),
          updatedAt: new Date().toISOString(),
        };
        if (quadrantChanged) {
          changedProduct = nextNode;
        }
        return nextNode;
      })
    );

    if (changedProduct) {
      setWizardProduct(changedProduct);
    }
  };

  const handleApplyAnsoff = (
    productId: string,
    ansoffStrategy: AnsoffStrategy,
    strategicLever: StrategicLever
  ) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        const { resourceCap, okrs } = generateExecutionPlan(
          p.name,
          p.bcgQuadrant,
          ansoffStrategy,
          strategicLever
        );
        return {
          ...p,
          ansoffStrategy,
          strategicLever,
          resourceCap,
          okrs,
          updatedAt: new Date().toISOString(),
        };
      })
    );
    setWizardProduct(null);
  };

  const handleCreateProduct = (data: {
    name: string;
    owner: string;
    marketShare: number;
    marketGrowth: number;
  }) => {
    const bcgQuadrant = classifyBcgQuadrant(data.marketShare, data.marketGrowth);
    const defaultAnsoff: AnsoffStrategy =
      bcgQuadrant === 'star' ? 'market_development' : 'market_penetration';
    const defaultLever: StrategicLever =
      bcgQuadrant === 'question_mark'
        ? 'Validation & Gatekeeping'
        : bcgQuadrant === 'star'
          ? 'Core Feature Velocity'
          : 'Margin & Cost Discipline';

    const { resourceCap, okrs } = generateExecutionPlan(
      data.name,
      bcgQuadrant,
      defaultAnsoff,
      defaultLever
    );

    const created: ProductNode = {
      id: `prod-${Date.now().toString(36)}`,
      name: data.name,
      owner: data.owner,
      marketShare: data.marketShare,
      marketGrowth: data.marketGrowth,
      bcgQuadrant,
      ansoffStrategy: defaultAnsoff,
      strategicLever: defaultLever,
      resourceCap,
      okrs,
      updatedAt: new Date().toISOString(),
    };

    setProducts((prev) => [created, ...prev]);
    setSelectedId(created.id);
    setNewModalOpen(false);
    setWizardProduct(created);
  };

  const handleDeleteProduct = (id: string) => {
    setProducts((prev) => {
      const next = prev.filter((p) => p.id !== id);
      if (selectedId === id) {
        setSelectedId(next[0]?.id ?? '');
      }
      return next;
    });
  };

  const handleUpdateKeyResult = (
    productId: string,
    objectiveId: string,
    krId: string,
    value: number
  ) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        return {
          ...p,
          okrs: p.okrs.map((o) => {
            if (o.id !== objectiveId) return o;
            return {
              ...o,
              keyResults: o.keyResults.map((kr) =>
                kr.id === krId
                  ? {
                      ...kr,
                      currentValue: clampNumber(
                        value,
                        kr.startValue,
                        kr.targetValue,
                        kr.currentValue
                      ),
                    }
                  : kr
              ),
            };
          }),
        };
      })
    );
  };

  const handleUpdateAllocatedBudget = (productId: string, allocatedPct: number) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? {
              ...p,
              resourceCap: {
                ...p.resourceCap,
                allocatedBudgetPct: clampNumber(allocatedPct, 0, 50, 10),
              },
            }
          : p
      )
    );
  };

  const avgOkrProgress =
    products.length > 0
      ? Math.round(
          products.reduce((acc, p) => acc + calculateProductOkrProgress(p), 0) /
            products.length
        )
      : 0;

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-[#0F172A]">
      <TopBar
        activeView={activeView}
        onSelectView={setActiveView}
        onNewProduct={() => setNewModalOpen(true)}
      />

      <main className="flex-1 max-w-[1360px] w-full mx-auto px-6 py-8">
        {/* Minimalist Workspace Sub-Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">
              {activeView === 'portfolio'
                ? 'Portfolio Strategy Bridge'
                : activeView === 'execution'
                  ? 'Team OKR Execution'
                  : 'Resource Cap Governance'}
            </h1>
          </div>

          <button
            type="button"
            onClick={() => setIoModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:text-[#0F172A] bg-white border border-slate-200 hover:border-slate-300 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <FileJson className="w-3.5 h-3.5" />
            JSON Export / Import
          </button>
        </div>

        {activeView === 'portfolio' && (
          <BcgMatrixView
            products={products}
            selectedId={selectedId}
            onSelectProduct={setSelectedId}
            onMoveProduct={handleMoveProduct}
            onUpdateProduct={handleUpdateProductDetails}
            onOpenAnsoffWizard={setWizardProduct}
            onDeleteProduct={handleDeleteProduct}
            onNavigateExecution={() => setActiveView('execution')}
          />
        )}

        {activeView === 'execution' && (
          <ExecutionOkrView
            products={products}
            onUpdateKeyResult={handleUpdateKeyResult}
            onOpenAnsoffWizard={setWizardProduct}
          />
        )}

        {activeView === 'caps' && (
          <ResourceCapsView
            products={products}
            onUpdateAllocatedBudget={handleUpdateAllocatedBudget}
          />
        )}
      </main>

      <AnsoffWizardModal
        product={wizardProduct}
        onClose={() => setWizardProduct(null)}
        onApply={handleApplyAnsoff}
      />

      <NewProductModal
        open={newModalOpen}
        onClose={() => setNewModalOpen(false)}
        onCreate={handleCreateProduct}
      />

      <ImportExportModal
        open={ioModalOpen}
        products={products}
        onClose={() => setIoModalOpen(false)}
        onImport={(imported) => {
          setProducts(imported);
          setSelectedId(imported[0]?.id ?? '');
        }}
        onReset={() => {
          setProducts(SEED_PORTFOLIO);
          setSelectedId(SEED_PORTFOLIO[0]?.id ?? '');
        }}
      />
    </div>
  );
}
