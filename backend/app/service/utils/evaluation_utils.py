from aequitas.flow.methods.preprocessing.label_flipping import LabelFlipping
from aequitas.flow.methods.preprocessing.data_repairer import DataRepairer
from aequitas.flow.methods.preprocessing.prevalence_sample import PrevalenceSampling
from themis_ml.preprocessing.relabelling import Relabeller

def run_label_flipping(X_train, y_train, s_train):
    #flipper = LabelFlipping(max_flip_rate=0.2, fair_ordering=True)
    flipper = LabelFlipping()
    flipper.fit(X_train, y_train, s_train)
    X_train_transformed, y_train_transformed, _ = flipper.transform(X_train, y_train, s_train)
    return X_train_transformed, y_train_transformed

def run_data_repairer(X_train, y_train, s_train):
    #repairer = DataRepairer(repair_level=1.0)
    repairer = DataRepairer()
    repairer.fit(X_train, y_train, s_train)
    X_train_transformed, y_train_transformed, _ = repairer.transform(X_train, y_train, s_train)
    return X_train_transformed, y_train_transformed

def run_prevalence_sampling(X_train, y_train, s_train):
    #sampler = PrevalenceSampling(alpha=1, strategy="undersample", s_ref="global")
    sampler = PrevalenceSampling()
    sampler.fit(X_train, y_train, s_train)
    X_train_transformed, y_train_transformed, s_sample = sampler.transform(X_train, y_train, s_train)

    return X_train_transformed, y_train_transformed

def run_relabeller(X_train, y_train, s_train):
    relabeller = Relabeller()
    relabeller.fit(X_train, y_train, s_train)
    y_train_transformed = relabeller.transform(X_train)
    return X_train, y_train_transformed