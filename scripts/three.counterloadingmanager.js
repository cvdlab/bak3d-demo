THREE.CounterLoadingManager = function ( onLoad, onProgress, onError ) {

  var scope = this;

  var isLoading = false;
  this.itemsLoaded = 0;
  this.itemsTotal = 0;

  this.onStart = undefined;
  this.onLoad = onLoad;
  this.onProgress = onProgress;
  this.onError = onError;

  this.itemStart = function ( url ) {

    this.itemsTotal ++;

    if ( isLoading === false ) {

      if ( scope.onStart !== undefined ) {

        scope.onStart( url, this.itemsLoaded, this.itemsTotal );

      }

    }

    isLoading = true;

  };

  this.itemEnd = function ( url ) {

    this.itemsLoaded ++;

    if ( scope.onProgress !== undefined ) {

      scope.onProgress( url, this.itemsLoaded, this.itemsTotal );

    }

    if ( this.itemsLoaded === this.itemsTotal ) {

      isLoading = false;

      if ( scope.onLoad !== undefined ) {

        scope.onLoad();

      }

    }

  };

  this.itemError = function ( url ) {

    if ( scope.onError !== undefined ) {

      scope.onError( url );

    }

  };

};
